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
/// Redis 不可用时自动降级为进程内内存缓存，保证业务不中断。
/// </summary>
public class CacheService
{
    private const string VersionKeySuffix = "ver";
    private readonly IDistributedCache? _cache;
    private readonly RedisOptions _options;
    private readonly SemaphoreSlim _lock = new(1, 1);

    /// <summary>Redis 降级标记：连续失败后切换为内存模式，避免每次请求都等超时。</summary>
    private int _fallbackCount;
    private const int MaxFallbackBeforeDegraded = 2;
    private volatile bool _degraded;
    private DateTime _degradedUntil = DateTime.MinValue;
    private readonly Dictionary<string, (byte[] data, DateTime expire)> _memCache = new();
    private readonly Dictionary<string, int> _memVersions = new();

    public CacheService(IDistributedCache? cache, IOptions<RedisOptions> options)
    {
        _cache = cache;
        _options = options.Value;
    }

    /// <summary>是否实际上启用缓存（配置开启且已注册分布式缓存且未降级）。</summary>
    public bool Enabled => _options.Enabled && _cache is not null;

    /// <summary>是否处于 Redis 降级模式。</summary>
    private bool IsDegraded
    {
        get
        {
            if (!_degraded) return false;
            // 30 秒后尝试恢复
            if (DateTime.UtcNow >= _degradedUntil)
            {
                _degraded = false;
                _fallbackCount = 0;
                return false;
            }
            return true;
        }
    }

    /// <summary>标记 Redis 不可用，切换为降级模式。</summary>
    private void MarkDegraded()
    {
        _degraded = true;
        _degradedUntil = DateTime.UtcNow.AddSeconds(30);
        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Testing")
            Console.WriteLine("[CacheService] Redis 不可用，降级为内存缓存（30s 后重试连接）");
    }

    /// <summary>默认缓存过期时长。</summary>
    public TimeSpan DefaultExpiry => TimeSpan.FromMinutes(Math.Max(1, _options.DefaultExpireMinutes));

    public async Task<T?> GetAsync<T>(string group, string key)
    {
        if (!Enabled) return default;
        if (IsDegraded) return GetMem<T>(group, key);

        try
        {
            var version = await GetVersionAsync(group).ConfigureAwait(false);
            var bytes = await _cache!.GetAsync(DataKey(group, key, version)).ConfigureAwait(false);
            if (bytes is null) return default;
            try
            {
                return JsonSerializer.Deserialize<T>(bytes, JsonOpts.Default);
            }
            catch (JsonException)
            {
                return default;
            }
        }
        catch
        {
            Interlocked.Increment(ref _fallbackCount);
            if (_fallbackCount >= MaxFallbackBeforeDegraded) MarkDegraded();
            return GetMem<T>(group, key);
        }
    }

    public Task SetAsync<T>(string group, string key, T value, TimeSpan? expiry = null)
        => SetAsync(group, key, value, expiry ?? DefaultExpiry);

    public async Task SetAsync<T>(string group, string key, T value, TimeSpan expiry)
    {
        if (!Enabled || value is null) return;
        if (IsDegraded) { SetMem(group, key, value, expiry); return; }

        try
        {
            var version = await GetVersionAsync(group).ConfigureAwait(false);
            await _cache!.SetAsync(
                DataKey(group, key, version),
                JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts.Default),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiry })
                .ConfigureAwait(false);
        }
        catch
        {
            Interlocked.Increment(ref _fallbackCount);
            if (_fallbackCount >= MaxFallbackBeforeDegraded) MarkDegraded();
            SetMem(group, key, value, expiry);
        }
    }

    /// <summary>
    /// 命中缓存直接返回；未命中则执行 factory 生成结果并写入缓存。
    /// 缓存关闭时始终执行 factory。
    /// </summary>
    public async Task<T?> GetOrCreateAsync<T>(string group, string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        if (!Enabled) return await factory().ConfigureAwait(false);
        var cached = await GetAsync<T>(group, key).ConfigureAwait(false);
        if (cached is not null) return cached;
        var value = await factory().ConfigureAwait(false);
        await SetAsync(group, key, value, expiry ?? DefaultExpiry).ConfigureAwait(false);
        return value;
    }

    /// <summary>
    /// 使某个组（如 traitors）的所有缓存失效：版本号 +1，旧键自然过期。
    /// </summary>
    public async Task InvalidateAsync(string group)
    {
        if (!Enabled) return;
        if (IsDegraded)
        {
            _memVersions[group] = (_memVersions.GetValueOrDefault(group) + 1);
            // 清理过期的内存缓存项
            var now = DateTime.UtcNow;
            var expiredKeys = _memCache.Keys
                .Where(k => k.StartsWith($"{RootKeyPrefix}{group}:") && _memCache[k].expire <= now)
                .ToList();
            foreach (var k in expiredKeys) _memCache.Remove(k);
            return;
        }

        try
        {
            var version = await GetVersionAsync(group).ConfigureAwait(false);
            await _cache!.SetAsync(
                VersionKey(group),
                Encoding.UTF8.GetBytes((version + 1).ToString()),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24) })
                .ConfigureAwait(false);
        }
        catch
        {
            MarkDegraded();
            _memVersions[group] = (_memVersions.GetValueOrDefault(group) + 1);
        }
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

    // ---- 内存缓存降级实现 ----

    private T? GetMem<T>(string group, string key)
    {
        var version = _memVersions.GetValueOrDefault(group);
        var mk = DataKey(group, key, version);
        if (!_memCache.TryGetValue(mk, out var entry)) return default;
        if (entry.expire <= DateTime.UtcNow)
        {
            _memCache.Remove(mk);
            return default;
        }
        try
        {
            return JsonSerializer.Deserialize<T>(entry.data, JsonOpts.Default);
        }
        catch
        {
            return default;
        }
    }

    private void SetMem<T>(string group, string key, T value, TimeSpan expiry)
    {
        var version = _memVersions.GetValueOrDefault(group);
        var mk = DataKey(group, key, version);
        _memCache[mk] = (JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts.Default), DateTime.UtcNow.Add(expiry));
    }

    private string VersionKey(string group) => $"{RootKeyPrefix}{VersionKeySuffix}:{group}";

    private string DataKey(string group, string key, int version) => $"{RootKeyPrefix}{group}:v{version}:{key}";

    private string RootKeyPrefix
    {
        get
        {
            var prefix = _options.InstanceName ?? "";
            return prefix.EndsWith(':') ? prefix : prefix + ":";
        }
    }
}