using System.Diagnostics;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 健康检查（监控系统拨测用，无需登录）：同时探测数据库与 Redis 连通性。
/// 数据库不可用 → 503 unhealthy（核心依赖）；
/// Redis 不可用 → 200 degraded（缓存层有熔断降级，业务仍可用，但监控系统可据此告警）。
/// 单项探测超时 3s，避免拨测请求长时间挂起。
/// </summary>
[ApiController]
public class HealthController(
    AppDbContext db,
    CacheService cache,
    IDistributedCache distCache,
    RedisCircuitBreaker breaker,
    IConfiguration config,
    ILogger<HealthController> logger) : ControllerBase
{
    private static readonly TimeSpan CheckTimeout = TimeSpan.FromSeconds(3);

    [HttpGet("/health")]
    [HttpGet("/api/health")] // 兼容经 Nginx /api 前缀反代的拨测地址
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var mysql = await CheckAsync(async token =>
        {
            var ok = await db.Database.CanConnectAsync(token);
            if (!ok) throw new InvalidOperationException("数据库连接失败");
        }, ct);

        CheckResult redis;
        if (!cache.Enabled)
        {
            // 配置未启用 Redis：不算故障，如实上报便于监控区分"关闭"与"宕机"
            redis = new CheckResult("disabled", null, null);
        }
        else
        {
            // 直接探测底层 IDistributedCache（绕过熔断器与 CacheService 的降级吞异常），
            // 一次 GET 往返即可验证连通性
            redis = await CheckAsync(token => distCache.GetAsync("health:ping", token), ct);
        }

        var unhealthy = mysql.Status == "unhealthy";
        var degraded = !unhealthy && redis.Status == "unhealthy";
        var overall = unhealthy ? "unhealthy" : degraded ? "degraded" : "healthy";

        if (unhealthy)
            logger.LogWarning("健康检查失败：数据库不可用（{Error}）", mysql.Error);
        else if (degraded)
            logger.LogWarning("健康检查降级：Redis 不可用（{Error}，熔断器 {State}）", redis.Error, breaker.CurrentState);

        return StatusCode(unhealthy ? 503 : 200, new
        {
            status = overall,
            timestamp = DateTimeOffset.UtcNow,
            checks = new
            {
                mysql = new
                {
                    status = mysql.Status,
                    latencyMs = mysql.LatencyMs,
                    error = mysql.Error,
                    provider = config["Database:Provider"],
                },
                redis = new
                {
                    status = redis.Status,
                    latencyMs = redis.LatencyMs,
                    error = redis.Error,
                    circuitBreaker = cache.Enabled ? breaker.CurrentState : null,
                },
            },
        });
    }

    private record CheckResult(string Status, long? LatencyMs, string? Error);

    /// <summary>执行单项探测：成功返回 healthy + 耗时；异常/超时返回 unhealthy + 异常类型名（不含连接串等细节）。</summary>
    private static async Task<CheckResult> CheckAsync(Func<CancellationToken, Task> probe, CancellationToken ct)
    {
        var start = Stopwatch.GetTimestamp();
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(CheckTimeout);
        try
        {
            await probe(cts.Token);
            return new CheckResult("healthy", (long)Stopwatch.GetElapsedTime(start).TotalMilliseconds, null);
        }
        catch (Exception ex)
        {
            var error = ex is OperationCanceledException ? "timeout" : ex.GetType().Name;
            return new CheckResult("unhealthy", (long)Stopwatch.GetElapsedTime(start).TotalMilliseconds, error);
        }
    }
}
