using HanJianNet.WebApi.Options;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// Redis 熔断器（单例，状态跨请求共享）。
/// 三态状态机：Closed（正常）→ Open（熔断，跳过 Redis 直连 MySQL）→ HalfOpen（半开探测）。
/// 连续失败达到阈值后熔断，期间所有 Redis 操作快速失败，避免每个请求都等连接超时；
/// 熔断时长到期后放行一个探测请求，成功则恢复，失败则重新熔断。
/// 熔断期间丢失的缓存失效请求会被记录，恢复后由 <see cref="CacheService"/> 补做整组失效。
/// </summary>
public class RedisCircuitBreaker
{
    private enum State : int
    {
        Closed = 0,
        Open = 1,
        HalfOpen = 2,
    }

    private readonly ILogger<RedisCircuitBreaker> _logger;
    private readonly int _failureThreshold;
    private readonly TimeSpan _openDuration;

    private int _state = (int)State.Closed;
    private int _consecutiveFailures;
    /// <summary>熔断截止时间（UtcNow.Ticks），仅 Open 状态有意义。</summary>
    private long _openUntilTicks;

    /// <summary>熔断期间被请求失效的缓存组，恢复后需补做失效。</summary>
    private readonly HashSet<string> _dirtyGroups = new(StringComparer.Ordinal);
    private readonly object _dirtyLock = new();

    public RedisCircuitBreaker(ILogger<RedisCircuitBreaker> logger, IOptions<RedisOptions> options)
    {
        _logger = logger;
        var opts = options.Value;
        _failureThreshold = Math.Max(1, opts.CircuitBreakerFailureThreshold);
        _openDuration = TimeSpan.FromSeconds(Math.Max(5, opts.CircuitBreakerOpenSeconds));
    }

    /// <summary>当前熔断器状态（closed/open/halfopen），供健康检查等观测使用。</summary>
    public string CurrentState => ((State)Volatile.Read(ref _state)).ToString().ToLowerInvariant();

    /// <summary>当前是否允许发起 Redis 操作。熔断期间直接返回 false，调用方应走降级路径。</summary>
    public bool AllowRequest()
    {
        var state = (State)Volatile.Read(ref _state);
        switch (state)
        {
            case State.Closed:
                return true;
            case State.Open:
                if (DateTime.UtcNow.Ticks < Interlocked.Read(ref _openUntilTicks))
                    return false;
                // 熔断时长到期：只允许一个线程进入 HalfOpen 发起探测
                if (Interlocked.CompareExchange(ref _state, (int)State.HalfOpen, (int)State.Open) == (int)State.Open)
                {
                    _logger.LogInformation("Redis 熔断器进入半开状态，放行一个探测请求");
                    return true;
                }
                // 已有其他线程切换为 HalfOpen，按熔断处理
                return ((State)Volatile.Read(ref _state)) == State.Closed;
            case State.HalfOpen:
                // 半开状态只放行一个探测请求，其余请求继续走降级
                return false;
            default:
                return true;
        }
    }

    /// <summary>Redis 操作成功：重置失败计数；半开探测成功则关闭熔断器。</summary>
    public void OnSuccess()
    {
        Interlocked.Exchange(ref _consecutiveFailures, 0);
        if (Interlocked.CompareExchange(ref _state, (int)State.Closed, (int)State.HalfOpen) == (int)State.HalfOpen)
            _logger.LogInformation("Redis 连接恢复，熔断器关闭");
    }

    /// <summary>Redis 操作失败：累计连续失败，达到阈值后打开熔断器。</summary>
    public void OnFailure()
    {
        var failures = Interlocked.Increment(ref _consecutiveFailures);

        // 半开探测失败：立即重新熔断
        if (Interlocked.CompareExchange(ref _state, (int)State.Open, (int)State.HalfOpen) == (int)State.HalfOpen)
        {
            Open("半开探测失败");
            return;
        }

        if (failures >= _failureThreshold &&
            Interlocked.CompareExchange(ref _state, (int)State.Open, (int)State.Closed) == (int)State.Closed)
        {
            Open($"连续失败 {failures} 次");
        }
    }

    private void Open(string reason)
    {
        Interlocked.Exchange(ref _openUntilTicks, DateTime.UtcNow.Add(_openDuration).Ticks);
        _logger.LogWarning(
            "Redis 熔断器打开（{Reason}），{Seconds}s 内缓存读写将跳过 Redis 直连数据库",
            reason, (int)_openDuration.TotalSeconds);
    }

    /// <summary>记录熔断期间丢失的缓存失效请求（按组）。</summary>
    public void MarkGroupDirty(string group)
    {
        lock (_dirtyLock) _dirtyGroups.Add(group);
    }

    /// <summary>取出并清空待补失效的缓存组；无待处理组时返回 false。</summary>
    public bool TryDrainDirtyGroups(out List<string> groups)
    {
        lock (_dirtyLock)
        {
            if (_dirtyGroups.Count == 0)
            {
                groups = [];
                return false;
            }
            groups = [.. _dirtyGroups];
            _dirtyGroups.Clear();
            return true;
        }
    }
}
