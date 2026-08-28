using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>档案相关操作。公开读取（列表/详情/统计）启用分布式缓存，写入时自动失效。</summary>
public class TraitorService(AppDbContext db, CacheService cache)
{
    private const string CacheGroup = "traitors";

    /// <summary>
    /// 公开列表查询。page/pageSize 未指定时返回全量（供地图统计等场景使用），指定时返回分页结果。
    /// </summary>
    public async Task<PagedResult<TraitorSummaryDto>> ListAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? nativePlace, int? page = null, int? pageSize = null)
    {
        var key = string.Join("|",
            name ?? "", yearFrom?.ToString() ?? "", yearTo?.ToString() ?? "",
            @event ?? "", period ?? "", nativePlace ?? "",
            page?.ToString() ?? "", pageSize?.ToString() ?? "");
        return await cache.GetOrCreateAsync(CacheGroup, $"list:{key}", () => ListCoreAsync(name, yearFrom, yearTo, @event, period, nativePlace, page, pageSize))
            ?? new PagedResult<TraitorSummaryDto>([], 0, 1, 10);
    }

    private async Task<PagedResult<TraitorSummaryDto>> ListCoreAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? nativePlace, int? page = null, int? pageSize = null)
    {
        var q = db.Traitors.Include(t => t.LifeEvents).AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var n = name!;
            q = q.Where(t => t.Name.Contains(n));
        }
        if (!string.IsNullOrWhiteSpace(nativePlace))
        {
            var np = nativePlace!;
            q = q.Where(t => t.NativePlace.Contains(np));
        }
        if (yearFrom is int yf)
            q = q.Where(t => (t.BirthYear != null && t.BirthYear >= yf) || (t.DeathYear != null && t.DeathYear >= yf));
        if (yearTo is int yt)
            q = q.Where(t => (t.BirthYear != null && t.BirthYear <= yt) || (t.DeathYear != null && t.DeathYear <= yt));
        if (!string.IsNullOrWhiteSpace(@event))
        {
            var ev = @event!;
            q = q.Where(t => t.LifeEvents.Any(e => e.Event.Contains(ev)));
        }
        if (!string.IsNullOrWhiteSpace(period))
            q = q.Where(t => t.Period == period);

        // 固定排序：按创建时间倒序（最新录入的在前）
        q = q.OrderByDescending(t => t.CreatedAt);

        var total = await q.CountAsync();
        List<Traitor> list;
        if (page.HasValue && pageSize.HasValue)
        {
            var p = Math.Max(1, page.Value);
            var ps = Math.Clamp(pageSize.Value, 1, 200);
            list = await q.Skip((p - 1) * ps).Take(ps).ToListAsync();
            return new PagedResult<TraitorSummaryDto>(
                Items: list.Select(t => t.ToSummary()).ToList(),
                Total: total,
                Page: p,
                PageSize: ps);
        }
        else
        {
            list = await q.ToListAsync();
            return new PagedResult<TraitorSummaryDto>(
                Items: list.Select(t => t.ToSummary()).ToList(),
                Total: total,
                Page: 1,
                PageSize: Math.Max(1, total));
        }
    }

    public async Task<TraitorDto> GetAsync(string id)
    {
        var cached = await cache.GetOrCreateAsync(CacheGroup, $"get:{id}", () => GetCoreAsync(id));
        return cached ?? throw new ApiException(404, "档案不存在");
    }

    private async Task<TraitorDto?> GetCoreAsync(string id)
    {
        var t = await WithIncludes().FirstOrDefaultAsync(t => t.Id == id);
        return t?.ToDto();
    }

    public async Task<List<RevisionDto>> GetRevisionsAsync(string traitorId)
    {
        var items = await db.Revisions
            .Where(r => r.TraitorId == traitorId)
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();
        return items.Select(r => r.ToDto()).ToList();
    }

    public async Task<TraitorStatsDto> GetStatsAsync()
    {
        return await cache.GetOrCreateAsync(CacheGroup, "stats", StatsCoreAsync)
            ?? new TraitorStatsDto();
    }

    private async Task<TraitorStatsDto> StatsCoreAsync()
    {
        var rows = await db.Traitors
            .Select(t => new { t.Period, t.BirthYear, t.DeathYear })
            .ToListAsync();
        var total = rows.Count;
        var periods = rows
            .GroupBy(t => t.Period)
            .ToDictionary(g => g.Key, g => g.Count());
        var years = rows
            .SelectMany(t => new[] { t.BirthYear, t.DeathYear })
            .Where(y => y.HasValue)
            .Select(y => y!.Value)
            .ToList();
        int? earliestYear = years.Count > 0 ? years.Min() : null;
        int? latestYear = years.Count > 0 ? years.Max() : null;
        return new TraitorStatsDto { Total = total, Periods = periods, EarliestYear = earliestYear, LatestYear = latestYear };
    }

    /// <summary>
    /// 分省统计：直接读取档案的 Province 字段，前端只负责展示。
    /// items 按数量降序；total 为档案总数；matched 为已填写省份的记录数。
    /// </summary>
    public async Task<ProvinceStatsDto> GetProvinceStatsAsync()
    {
        return await cache.GetOrCreateAsync(CacheGroup, "province-stats", ProvinceStatsCoreAsync)
            ?? new ProvinceStatsDto();
    }

    private async Task<ProvinceStatsDto> ProvinceStatsCoreAsync()
    {
        var provinces = await db.Traitors.Select(t => t.Province ?? "").ToListAsync();
        var counts = new Dictionary<string, int>();
        var matched = 0;
        foreach (var prov in provinces)
        {
            if (string.IsNullOrWhiteSpace(prov)) continue;
            matched++;
            counts[prov] = counts.TryGetValue(prov, out var c) ? c + 1 : 1;
        }
        var items = counts
            .OrderByDescending(kv => kv.Value)
            .Select(kv => new ProvinceStatItemDto { Province = kv.Key, FullName = ProvinceMatcher.FullName(kv.Key), Count = kv.Value })
            .ToList();
        return new ProvinceStatsDto { Items = items, Total = provinces.Count, Matched = matched };
    }

    public async Task<List<TimelineItemDto>> GetTimelineAsync()
    {
        return await cache.GetOrCreateAsync(CacheGroup, "timeline", TimelineCoreAsync)
            ?? [];
    }

    private async Task<List<TimelineItemDto>> TimelineCoreAsync()
    {
        var items = await db.LifeEvents
            .Include(e => e.Traitor)
            .Where(e => e.Year != null)
            .OrderBy(e => e.Year)
            .ToListAsync();
        return items.Select(e => new TimelineItemDto
        {
            Year = e.Year!.Value,
            TraitorId = e.TraitorId,
            TraitorName = e.Traitor.Name,
            Event = e.Event,
        }).ToList();
    }

    public async Task<string> CreateAsync(TraitorInputDto input, string changeSummary, string submitterId)
    {
        var revision = new Revision
        {
            TraitorId = null,
            SubmitterId = submitterId,
            ChangeSummary = changeSummary,
            PayloadJson = JsonSerializer.Serialize(input.ToSnapshot(), JsonOpts.Default),
            Status = "pending",
        };
        db.Revisions.Add(revision);
        await db.SaveChangesAsync();
        return revision.Id;
    }

    public async Task<string> UpdateAsync(string traitorId, TraitorInputDto input, string changeSummary, string submitterId)
    {
        _ = await db.Traitors.FindAsync(traitorId)
            ?? throw new ApiException(404, "档案不存在");
        var revision = new Revision
        {
            TraitorId = traitorId,
            SubmitterId = submitterId,
            ChangeSummary = changeSummary,
            PayloadJson = JsonSerializer.Serialize(input.ToSnapshot(), JsonOpts.Default),
            Status = "pending",
        };
        db.Revisions.Add(revision);
        await db.SaveChangesAsync();
        return revision.Id;
    }

    public async Task<TraitorDto> AdminCreateAsync(TraitorInputDto input)
    {
        var traitor = new Traitor();
        input.ToSnapshot().ApplyTo(traitor);
        db.Traitors.Add(traitor);
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
        var loaded = await WithIncludes().FirstAsync(t => t.Id == traitor.Id);
        return loaded.ToDto();
    }

    public async Task<TraitorDto> AdminUpdateAsync(string id, TraitorInputDto input)
    {
        var traitor = await WithIncludes().FirstOrDefaultAsync(t => t.Id == id)
                      ?? throw new ApiException(404, "档案不存在");
        input.ToSnapshot().ApplyTo(traitor);
        traitor.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
        return traitor.ToDto();
    }

    public async Task<PagedResult<TraitorSummaryDto>> AdminListAsync(string? name, int page = 1, int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 200) pageSize = 200;
        var q = db.Traitors.AsQueryable();
        if (!string.IsNullOrWhiteSpace(name))
        {
            var n = name!;
            q = q.Where(t => t.Name.Contains(n));
        }
        var total = await q.CountAsync();
        var list = await q
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PagedResult<TraitorSummaryDto>(
            Items: list.Select(t => t.ToSummary()).ToList(),
            Total: total,
            Page: page,
            PageSize: pageSize);
    }

    public async Task<TraitorDto> AdminGetAsync(string id) => await GetAsync(id);

    private IQueryable<Traitor> WithIncludes() => db.Traitors
        .Include(t => t.Spouses)
        .Include(t => t.Children)
        .Include(t => t.Residences)
        .Include(t => t.CrimeRecords)
        .Include(t => t.LifeEvents)
        .Include(t => t.Attachments)
        .Include(t => t.Sources)
        .Include(t => t.Revisions);
}
