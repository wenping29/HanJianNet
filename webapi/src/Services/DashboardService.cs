using System.Data;
using System.Diagnostics;
using System.Runtime.InteropServices;
using HanJianNet.WebApi.Data;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 后台数据看板：服务器/数据库运行状态与站点数据总览。
/// 计数口径：汉奸排除已合并记录；活跃用户为近 7 日登录成功去重用户。
/// </summary>
public class DashboardService(AppDbContext db, IHostEnvironment env)
{
    /// <summary>活跃用户统计窗口（天）</summary>
    private const int ActiveUserDays = 7;

    public record DashboardCounts(
        int TraitorCount,
        int VisitorCount,
        long PageViewCount,
        int UserCount,
        int ActiveUserCount,
        long QueryCount);

    public record ServerStatus(
        string MachineName,
        string OsDescription,
        string Environment,
        string Framework,
        int ProcessId,
        int ProcessorCount,
        long WorkingSetMb,
        long ManagedMemoryMb,
        long OsUptimeSeconds,
        DateTime? StartedAt,
        long? UptimeSeconds);

    public record DatabaseStatus(
        string Provider,
        string ProviderName,
        bool Connected,
        long? LatencyMs,
        string? DatabaseName,
        string? ServerVersion);

    public record OverviewDto(ServerStatus Server, DatabaseStatus Database, DashboardCounts Counts);

    public record DailyLoginPoint(string Date, int Count);

    /// <summary>看板总览：服务器状态 + 数据库状态 + 六项计数。</summary>
    public async Task<OverviewDto> GetOverviewAsync()
        => new(GetServerStatus(), await GetDatabaseStatusAsync(), await GetCountsAsync());

    /// <summary>
    /// 每日登录用户趋势：按「登录成功的去重用户数」统计，缺失日期补 0。
    /// </summary>
    public async Task<IReadOnlyList<DailyLoginPoint>> GetLoginTrendAsync(int days)
    {
        days = Math.Clamp(days, 7, 90);
        var firstLocalDay = DateTime.Now.Date.AddDays(-(days - 1));

        // SQL 过滤按 UTC 多放宽一天，避免本地时区把首日截断。
        // 只投影到最小字段后在内存里分组：CreatedAt 是 DateTimeOffset，
        // EF/Pomelo 对 .Date 的 SQL 翻译不可靠，而这里的行数被时间范围收窄、可控。
        var filterFrom = DateTimeOffset.UtcNow.AddDays(-days);
        var rows = await db.LoginLogs
            .Where(l => l.Action == "login" && l.Status == "success" && l.CreatedAt >= filterFrom)
            .Select(l => new { l.CreatedAt, l.UserId })
            .ToListAsync();

        var usersByDay = new Dictionary<DateTime, HashSet<string>>();
        foreach (var row in rows)
        {
            var day = row.CreatedAt.ToLocalTime().Date;
            if (!usersByDay.TryGetValue(day, out var set))
            {
                set = new HashSet<string>();
                usersByDay[day] = set;
            }
            // 同一天同一用户重复登录只计一次
            set.Add(row.UserId ?? "");
        }

        var points = new List<DailyLoginPoint>(days);
        for (var i = 0; i < days; i++)
        {
            var day = firstLocalDay.AddDays(i);
            points.Add(new DailyLoginPoint(
                day.ToString("yyyy-MM-dd"),
                usersByDay.TryGetValue(day, out var set) ? set.Count : 0));
        }
        return points;
    }

    private async Task<DashboardCounts> GetCountsAsync()
    {
        var activeSince = DateTimeOffset.UtcNow.AddDays(-ActiveUserDays);

        var traitorCount = await db.Traitors.CountAsync(t => t.MergedIntoId == null);
        var visitorCount = await db.VisitLogs.Select(v => v.VisitorToken).Distinct().CountAsync();
        var pageViewCount = await db.VisitLogs.LongCountAsync();
        var userCount = await db.Users.CountAsync();
        var activeUserCount = await db.LoginLogs
            .Where(l => l.Action == "login" && l.Status == "success" && l.CreatedAt >= activeSince)
            .Select(l => l.UserId)
            .Distinct()
            .CountAsync();
        var queryCount = await db.QueryLogs.LongCountAsync();

        return new DashboardCounts(traitorCount, visitorCount, pageViewCount,
            userCount, activeUserCount, queryCount);
    }

    private ServerStatus GetServerStatus()
    {
        using var proc = Process.GetCurrentProcess();

        // StartTime 在部分平台会抛（如受限的容器环境），失败时前端显示「—」
        DateTime? startedAt = null;
        try
        {
            startedAt = proc.StartTime.ToUniversalTime();
        }
        catch
        {
            // 忽略：无法获取进程启动时间
        }

        return new ServerStatus(
            MachineName: System.Environment.MachineName,
            OsDescription: RuntimeInformation.OSDescription,
            Environment: env.EnvironmentName,
            Framework: RuntimeInformation.FrameworkDescription,
            ProcessId: System.Environment.ProcessId,
            ProcessorCount: System.Environment.ProcessorCount,
            WorkingSetMb: proc.WorkingSet64 / 1048576,
            ManagedMemoryMb: GC.GetTotalMemory(false) / 1048576,
            OsUptimeSeconds: System.Environment.TickCount64 / 1000,
            StartedAt: startedAt,
            UptimeSeconds: startedAt is null
                ? null
                : (long)(DateTime.UtcNow - startedAt.Value).TotalSeconds);
    }

    private async Task<DatabaseStatus> GetDatabaseStatusAsync()
    {
        var provider = db.Database.IsSqlite() ? "SQLite" : "MySQL";
        var providerName = db.Database.ProviderName ?? "";

        var sw = Stopwatch.StartNew();
        bool connected;
        try
        {
            connected = await db.Database.CanConnectAsync();
        }
        catch
        {
            connected = false;
        }
        sw.Stop();

        string? databaseName = null;
        string? serverVersion = null;
        if (connected)
        {
            // 库名/版本只能从已打开的连接上读取；CanConnectAsync 返回后连接是关的
            var conn = db.Database.GetDbConnection();
            var wasOpen = conn.State == ConnectionState.Open;
            try
            {
                if (!wasOpen) await conn.OpenAsync();
                databaseName = conn.Database;
                serverVersion = conn.ServerVersion;
            }
            catch
            {
                // 忽略：拿不到版本信息不影响连通性判定
            }
            finally
            {
                if (!wasOpen && conn.State == ConnectionState.Open) await conn.CloseAsync();
            }
        }

        return new DatabaseStatus(provider, providerName, connected,
            connected ? sw.ElapsedMilliseconds : null, databaseName, serverVersion);
    }
}
