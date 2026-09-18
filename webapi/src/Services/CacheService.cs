using System.Collections.Concurrent;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Options;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 分布式缓存服务（底层为 Redis）。
/// 通过 "Redis:Enabled" 控制开关：关闭时所有读写操作直接跳过，不影响业务。
/// 采用"版本号+组"策略实现缓存失效：同一组的键都带当前版本号，
/// 调用 InvalidateAsync 后版本号 +1，旧键自然过期，无需逐个删除。
///
/// 熔断降级：Redis 连续失败达到阈值后 <see cref="RedisCircuitBreaker"/>（单例）打开熔断，
/// 期间所有缓存读写快速跳过，读请求直接回源 MySQL，避免每个请求都等连接超时；
/// 恢复后自动补做熔断期间丢失的缓存失效，防止读到脏数据。
/// 防击穿/雪崩：缓存未命中按 key 加 single-flight 锁，同一 key 并发回源只查一次库；
/// 过期时间加 ±10% 随机抖动，避免大量键同时过期。
/// </summary>
public class CacheService
{
    private const string VersionKeySuffix = "ver";
    private readonly IDistributedCache? _cache;
    private readonly RedisOptions _options;
    private readonly RedisCircuitBreaker _breaker;
    private readonly ILogger<CacheService> _logger;

    /// <summary>
    /// single-flight 锁（进程级共享）：防止同一 key 缓存未命中时并发请求同时打到数据库。
    /// </summary>
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> KeyLocks = new(StringComparer.Ordinal);

    public CacheService(
        IDistributedCache? cache,
        IOptions<RedisOptions> options,
        RedisCircuitBreaker breaker,
        ILogger<CacheService> logger)
    {
        _cache = cache;
        _options = options.Value;
        _breaker = breaker;
        _logger = logger;
    }

    /// <summary>是否实际上启用缓存（配置开启且已注册分布式缓存）。</summary>
    public bool Enabled => _options.Enabled && _cache is not null;

    /// <summary>默认缓存过期时长。</summary>
    public TimeSpan DefaultExpiry => TimeSpan.FromMinutes(Math.Max(1, _options.DefaultExpireMinutes));

    /// <summary>统计类缓存过期时长（首页统计/分省统计/时间线）。</summary>
    public TimeSpan StatsExpiry => TimeSpan.FromMinutes(Math.Max(1, _options.StatsExpireMinutes));

    /// <summary>列表页缓存过期时长。</summary>
    public TimeSpan ListExpiry => TimeSpan.FromMinutes(Math.Max(1, _options.ListExpireMinutes));

    /// <summary>详情缓存过期时长（档案详情/事件详情）。</summary>
    public TimeSpan DetailExpiry => TimeSpan.FromMinutes(Math.Max(1, _options.DetailExpireMinutes));

    /// <summary>列表缓存的最大页码：超过该页的请求应绕过缓存直接回源，避免深页撑爆 Redis。</summary>
    public int MaxCachedListPage => Math.Max(1, _options.MaxCachedListPage);

    public async Task<T?> GetAsync<T>(string group, string key)
    {
        if (!Enabled) return default;
        if (!_breaker.AllowRequest()) return default;

        try
        {
            await InvalidateDirtyGroupsIfNeededAsync().ConfigureAwait(false);
            var version = await GetVersionAsync(group).ConfigureAwait(false);
            var bytes = await _cache!.GetAsync(DataKey(group, key, version)).ConfigureAwait(false);
            _breaker.OnSuccess();
            if (bytes is null) return default;
            try
            {
                return JsonSerializer.Deserialize<T>(MaybeDecompress(bytes), JsonOpts.Default);
            }
            catch (JsonException)
            {
                return default;
            }
        }
        catch (Exception ex)
        {
            _breaker.OnFailure();
            _logger.LogDebug(ex, "Redis 读取失败，已降级直连数据库（group={Group}, key={Key}）", group, key);
            return default;
        }
    }

    public Task SetAsync<T>(string group, string key, T value, TimeSpan? expiry = null)
        => SetAsync(group, key, value, expiry ?? DefaultExpiry);

    public async Task SetAsync<T>(string group, string key, T value, TimeSpan expiry)
    {
        if (!Enabled || value is null) return;
        if (!_breaker.AllowRequest()) return;

        try
        {
            await InvalidateDirtyGroupsIfNeededAsync().ConfigureAwait(false);
            var version = await GetVersionAsync(group).ConfigureAwait(false);
            var payload = MaybeCompress(JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts.Default));
            await _cache!.SetAsync(
                DataKey(group, key, version),
                payload,
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = WithJitter(expiry) })
                .ConfigureAwait(false);
            _breaker.OnSuccess();
        }
        catch (Exception ex)
        {
            _breaker.OnFailure();
            // 缓存写入失败不影响业务，下次读取会回源重建
            _logger.LogDebug(ex, "Redis 写入失败，已跳过（group={Group}, key={Key}）", group, key);
        }
    }

    /// <summary>
    /// 命中缓存直接返回；未命中则执行 factory 生成结果并写入缓存。
    /// 缓存关闭或熔断期间始终执行 factory（直连 MySQL）。
    /// 同一 key 并发未命中时通过 single-flight 锁保证只有一个请求回源，防止缓存击穿。
    /// </summary>
    public async Task<T?> GetOrCreateAsync<T>(string group, string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        if (!Enabled) return await factory().ConfigureAwait(false);
        var cached = await GetAsync<T>(group, key).ConfigureAwait(false);
        if (cached is not null) return cached;

        var lockKey = $"{group}:{key}";
        var keyLock = KeyLocks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));
        await keyLock.WaitAsync().ConfigureAwait(false);
        try
        {
            // double-check：等待锁期间可能已有其他请求回源并写入缓存
            cached = await GetAsync<T>(group, key).ConfigureAwait(false);
            if (cached is not null) return cached;

            var value = await factory().ConfigureAwait(false);
            await SetAsync(group, key, value, expiry ?? DefaultExpiry).ConfigureAwait(false);
            return value;
        }
        finally
        {
            keyLock.Release();
            // 锁空闲后移除，避免字典无限增长；仍有等待者时 TryRemove 不影响其持锁
            if (keyLock.CurrentCount == 1)
                KeyLocks.TryRemove(new KeyValuePair<string, SemaphoreSlim>(lockKey, keyLock));
        }
    }

    /// <summary>
    /// 使某个组（如 traitors）的所有缓存失效：版本号 +1，旧键自然过期。
    /// 熔断期间无法写入 Redis，记录为脏组，熔断恢复后由读/写路径补做失效。
    /// </summary>
    public async Task InvalidateAsync(string group)
    {
        if (!Enabled) return;
        if (!_breaker.AllowRequest())
        {
            _breaker.MarkGroupDirty(group);
            return;
        }

        try
        {
            await BumpVersionAsync(group).ConfigureAwait(false);
            _breaker.OnSuccess();
        }
        catch (Exception ex)
        {
            _breaker.OnFailure();
            _breaker.MarkGroupDirty(group);
            _logger.LogWarning(ex, "Redis 缓存失效失败，已记录待恢复后补做（group={Group}）", group);
        }
    }

    /// <summary>熔断恢复后补做熔断期间丢失的整组失效，防止读到脏数据。</summary>
    private async Task InvalidateDirtyGroupsIfNeededAsync()
    {
        if (!_breaker.TryDrainDirtyGroups(out var groups)) return;
        foreach (var group in groups)
        {
            try
            {
                await BumpVersionAsync(group).ConfigureAwait(false);
                _logger.LogInformation("已补做熔断期间的缓存失效（group={Group}）", group);
            }
            catch (Exception ex)
            {
                // 补做失败重新记录，下次再试
                _breaker.MarkGroupDirty(group);
                _logger.LogWarning(ex, "补做缓存失效失败，已重新记录（group={Group}）", group);
                throw; // 让外层走 OnFailure 降级路径
            }
        }
    }

    private async Task BumpVersionAsync(string group)
    {
        var version = await GetVersionAsync(group).ConfigureAwait(false);
        await _cache!.SetAsync(
            VersionKey(group),
            Encoding.UTF8.GetBytes((version + 1).ToString()),
            new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) })
            .ConfigureAwait(false);
    }

    private Task<int> GetVersionAsync(string group) => _cache == null
        ? Task.FromResult(0)
        : ReadVersionAsync(group);

    private async Task<int> ReadVersionAsync(string group)
    {
        var bytes = await _cache!.GetAsync(VersionKey(group)).ConfigureAwait(false);
        if (bytes is null) return 0;
        return int.TryParse(Encoding.UTF8.GetString(bytes), out var v) ? v : 0;
    }

    /// <summary>过期时间加 ±10% 随机抖动，防止大量键同时过期引发缓存雪崩。</summary>
    private static TimeSpan WithJitter(TimeSpan expiry)
    {
        var jitter = 0.9 + Random.Shared.NextDouble() * 0.2;
        return TimeSpan.FromTicks((long)(expiry.Ticks * jitter));
    }

    // ---- 大 value gzip 透明压缩（防大 key） ----

    /// <summary>序列化后的值超过阈值时 gzip 压缩存储。</summary>
    private byte[] MaybeCompress(byte[] bytes)
    {
        if (bytes.Length < Math.Max(1024, _options.CompressThresholdBytes)) return bytes;
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Fastest))
            gzip.Write(bytes, 0, bytes.Length);
        return output.ToArray();
    }

    /// <summary>检测 gzip magic（0x1F 0x8B，JSON UTF-8 首字节不可能是 0x1F）并解压；未压缩原样返回。</summary>
    private static byte[] MaybeDecompress(byte[] bytes)
    {
        if (bytes.Length < 2 || bytes[0] != 0x1F || bytes[1] != 0x8B) return bytes;
        using var input = new MemoryStream(bytes);
        using var gzip = new GZipStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        gzip.CopyTo(output);
        return output.ToArray();
    }

    // key 前缀（InstanceName）统一由 IDistributedCache 实现层添加，这里不再重复拼接
    private static string VersionKey(string group) => $"{VersionKeySuffix}:{group}";

    private static string DataKey(string group, string key, int version) => $"{group}:v{version}:{key}";
}
