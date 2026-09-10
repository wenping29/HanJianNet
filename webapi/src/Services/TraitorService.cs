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

    /// <summary>
    /// 查找重复记录：按 Name + NativePlace 分组，仅返回未合并（MergedIntoId == null）且 Count > 1 的组。
    /// 可选 name/nativePlace 过滤。
    /// </summary>
    public async Task<List<DuplicateGroupDto>> FindDuplicatesAsync(string? name, string? nativePlace)
    {
        var q = db.Traitors.AsQueryable();
        q = q.Where(t => t.MergedIntoId == null);
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

        // 只取同名同籍贯且重复数>1的组的 key
        var dupKeys = await q
            .GroupBy(t => new { t.Name, t.NativePlace })
            .Where(g => g.Count() > 1)
            .Select(g => new { g.Key.Name, g.Key.NativePlace })
            .ToListAsync();

        var result = new List<DuplicateGroupDto>();
        foreach (var key in dupKeys)
        {
            var items = await q
                .Where(t => t.Name == key.Name && t.NativePlace == key.NativePlace)
                .OrderBy(t => t.CreatedAt)
                .ToListAsync();
            result.Add(new DuplicateGroupDto
            {
                Name = key.Name,
                NativePlace = key.NativePlace,
                Items = items.Select(t => t.ToSummary()).ToList(),
            });
        }
        return result;
    }

    /// <summary>
    /// 合并：将 sourceIds 的所有子记录迁移到 primaryId，合并 JSON 数组字段（不去重），标记 source 为已合并。
    /// </summary>
    public async Task<TraitorDto> MergeAsync(string primaryId, List<string> sourceIds)
    {
        if (sourceIds.Count == 0)
            throw new ApiException(400, "未选择要合并的重复记录");
        if (sourceIds.Contains(primaryId))
            throw new ApiException(400, "主记录不能同时出现在被合并列表中");

        var primary = await WithIncludes().FirstOrDefaultAsync(t => t.Id == primaryId)
                      ?? throw new ApiException(404, "主记录不存在");
        if (primary.MergedIntoId != null)
            throw new ApiException(400, "主记录已被合并，不能作为合并目标");

        // 合并 JSON 数组字段（union，不去重）
        var primaryAliases = DeserializeListSafe(primary.AliasesJson);
        var primaryTags = DeserializeListSafe(primary.IdentityTagsJson);
        var primaryRelated = DeserializeListSafe(primary.RelatedIdsJson);

        foreach (var sid in sourceIds.Distinct())
        {
            var source = await db.Traitors.AsTracking().FirstOrDefaultAsync(t => t.Id == sid)
                         ?? throw new ApiException(404, $"被合并记录 {sid} 不存在");
            if (source.MergedIntoId != null)
                throw new ApiException(400, $"记录 {source.Name} 已被合并，不能重复合并");

            // 迁移子记录：直接 UPDATE TraitorId（EF Core 跟踪 entity 后改 FK 即可批量 UPDATE）
            foreach (var s in db.Spouses.Where(x => x.TraitorId == sid)) s.TraitorId = primaryId;
            foreach (var c in db.Children.Where(x => x.TraitorId == sid)) c.TraitorId = primaryId;
            foreach (var r in db.Residences.Where(x => x.TraitorId == sid)) r.TraitorId = primaryId;
            foreach (var c in db.CrimeRecords.Where(x => x.TraitorId == sid)) c.TraitorId = primaryId;
            foreach (var e in db.LifeEvents.Where(x => x.TraitorId == sid)) e.TraitorId = primaryId;
            foreach (var a in db.Attachments.Where(x => x.TraitorId == sid)) a.TraitorId = primaryId;
            foreach (var s in db.Sources.Where(x => x.TraitorId == sid)) s.TraitorId = primaryId;
            foreach (var r in db.Revisions.Where(x => x.TraitorId == sid)) r.TraitorId = primaryId;

            // 合并 JSON 数组
            primaryAliases.AddRange(DeserializeListSafe(source.AliasesJson));
            primaryTags.AddRange(DeserializeListSafe(source.IdentityTagsJson));
            primaryRelated.AddRange(DeserializeListSafe(source.RelatedIdsJson));

            // 标记为已合并
            source.MergedIntoId = primaryId;
            source.MergedAt = DateTime.UtcNow;
        }

        primary.AliasesJson = JsonSerializer.Serialize(primaryAliases, JsonOpts.Default);
        primary.IdentityTagsJson = JsonSerializer.Serialize(primaryTags, JsonOpts.Default);
        primary.RelatedIdsJson = JsonSerializer.Serialize(primaryRelated, JsonOpts.Default);
        primary.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);

        var loaded = await WithIncludes().FirstAsync(t => t.Id == primaryId);
        return loaded.ToDto();
    }

    private static List<string> DeserializeListSafe(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOpts.Default) ?? [];
        }
        catch
        {
            return [];
        }
    }

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
