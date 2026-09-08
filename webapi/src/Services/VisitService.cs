using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 前台访客统计服务。
/// 每次页面访问调用 <see cref="TrackAsync"/> 记录一条访问（PV），VisitorToken 去重后为访客数（UV）。
/// </summary>
public class VisitService(AppDbContext db)
{
    public record VisitStats(long TotalVisits, long TotalVisitors);

    /// <summary>记录一次前台访问。token 为空或同会话已记录时忽略去重前的重复计次（由调用方控制）。</summary>
    public async Task TrackAsync(string? visitorToken)
    {
        if (string.IsNullOrWhiteSpace(visitorToken)) return;
        if (visitorToken.Length > 128) visitorToken = visitorToken[..128];

        db.VisitLogs.Add(new VisitLog { VisitorToken = visitorToken });
        await db.SaveChangesAsync();
    }

    /// <summary>统计总访问量与总访客数。</summary>
    public async Task<VisitStats> GetStatsAsync()
    {
        var totalVisits = await db.VisitLogs.LongCountAsync();
        var totalVisitors = await db.VisitLogs.Select(v => v.VisitorToken).Distinct().LongCountAsync();
        return new VisitStats(totalVisits, totalVisitors);
    }
}
