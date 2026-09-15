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
    public async Task<PagedResult<TraitorSummaryDto>> ListAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? page = null, int? pageSize = null)
    {
        var key = string.Join("|",
            name ?? "", yearFrom?.ToString() ?? "", yearTo?.ToString() ?? "",
            @event ?? "", period ?? "", province ?? "",
            page?.ToString() ?? "", pageSize?.ToString() ?? "");
        return await cache.GetOrCreateAsync(CacheGroup, $"list:{key}", () => ListCoreAsync(name, yearFrom, yearTo, @event, period, province, page, pageSize))
            ?? new PagedResult<TraitorSummaryDto>([], 0, 1, 10);
    }

    private async Task<PagedResult<TraitorSummaryDto>> ListCoreAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? page = null, int? pageSize = null)
    {
        var q = db.Traitors.AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var n = name!;
            q = q.Where(t => t.Name.Contains(n));
        }
        if (!string.IsNullOrWhiteSpace(province))
        {
            var pv = province!;
            q = q.Where(t => t.Province == pv);
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

        // 固定排序：危害等级升序（1=特级 最严重在前），未分级排最后；同级按创建时间倒序
        q = q.OrderBy(t => t.HarmLevel == null ? 1 : 0)
             .ThenBy(t => t.HarmLevel)
             .ThenByDescending(t => t.CreatedAt);

        var total = await q.CountAsync();
        // 犯罪记录条数在 SQL 侧聚合，避免把明细全部读入内存
        if (page.HasValue && pageSize.HasValue)
        {
            var p = Math.Max(1, page.Value);
            var ps = Math.Clamp(pageSize.Value, 1, 200);
            var rows = await q.Skip((p - 1) * ps).Take(ps)
                .Select(t => new { Traitor = t, CrimeCount = t.CrimeRecords.Count })
                .ToListAsync();
            return new PagedResult<TraitorSummaryDto>(
                Items: rows.Select(r => r.Traitor.ToSummary(r.CrimeCount)).ToList(),
                Total: total,
                Page: p,
                PageSize: ps);
        }
        else
        {
            var rows = await q
                .Select(t => new { Traitor = t, CrimeCount = t.CrimeRecords.Count })
                .ToListAsync();
            return new PagedResult<TraitorSummaryDto>(
                Items: rows.Select(r => r.Traitor.ToSummary(r.CrimeCount)).ToList(),
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

        // 被判刑人数：有犯罪记录的档案数
        var sentenced = await db.Traitors.CountAsync(t => t.CrimeRecords.Any());
        // 子女信息数：有子女记录的档案数
        var childrenInfo = await db.Traitors.CountAsync(t => t.Children.Any());
        // 后代现状数：子女去向（Whereabouts）不为空的记录数
        var descendantsStatus = await db.Children.CountAsync(c => c.Whereabouts != null && c.Whereabouts.Trim() != "");

        return new TraitorStatsDto
        {
            Total = total,
            Sentenced = sentenced,
            ChildrenInfo = childrenInfo,
            DescendantsStatus = descendantsStatus,
            Periods = periods,
            EarliestYear = earliestYear,
            LatestYear = latestYear
        };
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

    public async Task<PagedResult<TraitorSummaryDto>> AdminListAsync(string? name, int? harmLevel, int page = 1, int pageSize = 10)
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
        if (harmLevel is int hl)
            q = q.Where(t => t.HarmLevel == hl);
        var total = await q.CountAsync();
        // 固定排序：危害等级升序（1=特级/S级 最严重在前），未分级排最后；同级按姓名，再按创建时间倒序
        var rows = await q
            .OrderBy(t => t.HarmLevel == null ? 1 : 0)
            .ThenBy(t => t.HarmLevel)
            .ThenBy(t => t.Name)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                T = t,
                Titles = t.CrimeRecords
                    .Where(c => !string.IsNullOrWhiteSpace(c.Title))
                    .Select(c => c.Title)
                    .Take(10)
                    .ToList(),
            })
            .ToListAsync();
        return new PagedResult<TraitorSummaryDto>(
            Items: rows.Select(r => r.T.ToSummary(r.Titles.Count, r.Titles)).ToList(),
            Total: total,
            Page: page,
            PageSize: pageSize);
    }

    public async Task<TraitorDto> AdminGetAsync(string id) => await GetAsync(id);

    /// <summary>
    /// 删除汉奸档案：其全部子记录（罪行/配偶/子女/住所/生平/附件/来源）由数据库级联删除。
    /// 若该记录已被其他档案作为合并目标引用（MergedIntoId == id），拒绝删除以保持数据完整。
    /// </summary>
    public async Task AdminDeleteAsync(string id)
    {
        var traitor = await db.Traitors.FirstOrDefaultAsync(t => t.Id == id)
                      ?? throw new ApiException(404, "档案不存在");

        if (await db.Traitors.AnyAsync(t => t.MergedIntoId == id))
            throw new ApiException(409, "该记录已被其他档案合并引用，请先解除合并后再删除");

        db.Traitors.Remove(traitor);
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
    }

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
    /// 合并：将 sourceIds 的记录合并到 primaryId。
    /// 标量字段按 ScalarSources 选择来源记录复制（缺省保留主记录值）；
    /// 集合字段按 CollectionSources 决定纳入哪些记录的数据（缺省全部）；
    /// 修订记录始终迁移以保留审计链路；子记录被排除时仍留在源记录（该记录随后被标记为已合并，公开展示隐藏）。
    /// </summary>
    public async Task<TraitorDto> MergeAsync(MergeRequestDto req)
    {
        var primaryId = req.PrimaryId;
        var sourceIds = req.SourceIds;
        if (sourceIds.Count == 0)
            throw new ApiException(400, "未选择要合并的重复记录");
        if (sourceIds.Contains(primaryId))
            throw new ApiException(400, "主记录不能同时出现在被合并列表中");

        var memberIds = new HashSet<string>(sourceIds) { primaryId };
        foreach (var (field, rid) in req.ScalarSources)
        {
            if (!memberIds.Contains(rid))
                throw new ApiException(400, $"字段 {field} 指定了无效的来源记录");
        }
        foreach (var (field, list) in req.CollectionSources)
        {
            foreach (var rid in list)
            {
                if (!memberIds.Contains(rid))
                    throw new ApiException(400, $"集合 {field} 指定了无效的来源记录");
            }
        }

        var primary = await WithIncludes().FirstOrDefaultAsync(t => t.Id == primaryId)
                      ?? throw new ApiException(404, "主记录不存在");
        if (primary.MergedIntoId != null)
            throw new ApiException(400, "主记录已被合并，不能作为合并目标");

        var sourceRecords = new List<Traitor>();
        foreach (var sid in sourceIds.Distinct())
        {
            var source = await db.Traitors.AsTracking().FirstOrDefaultAsync(t => t.Id == sid)
                         ?? throw new ApiException(404, $"被合并记录 {sid} 不存在");
            if (source.MergedIntoId != null)
                throw new ApiException(400, $"记录 {source.Name} 已被合并，不能重复合并");
            sourceRecords.Add(source);
        }

        var memberById = sourceRecords.ToDictionary(s => s.Id);
        memberById[primaryId] = primary;

        Traitor Pick(string field) => memberById[req.ScalarSources.GetValueOrDefault(field, primaryId)];

        // ---------- 标量字段：按用户选择复制来源记录的值 ----------
        primary.Name = Pick("name").Name;
        primary.CourtesyName = Pick("courtesyName").CourtesyName;
        primary.Pseudonym = Pick("pseudonym").Pseudonym;
        var birth = Pick("birthYear");
        primary.BirthYear = birth.BirthYear;
        primary.BirthYearType = birth.BirthYearType;
        var death = Pick("deathYear");
        primary.DeathYear = death.DeathYear;
        primary.DeathYearType = death.DeathYearType;
        primary.NativePlace = Pick("nativePlace").NativePlace;
        primary.BirthPlace = Pick("birthPlace").BirthPlace;
        primary.Period = Pick("period").Period;
        primary.Faction = Pick("faction").Faction;
        primary.Summary = Pick("summary").Summary;
        primary.HarmLevel = Pick("harmLevel").HarmLevel;
        primary.Title = Pick("title").Title;
        // 省份字段与籍贯保持一致（按选择后的籍贯重新归一化）
        primary.Province = ProvinceMatcher.TryMatch(primary.NativePlace, out var mp) ? mp : "";

        bool IncludeColl(string coll, string rid) =>
            !req.CollectionSources.TryGetValue(coll, out var list) || list.Contains(rid);

        // ---------- JSON 数组集合：按用户选择求并集 ----------
        List<string> UnionColl(string coll, Func<Traitor, string> getter)
        {
            var merged = new List<string>();
            foreach (var member in memberById.Values)
            {
                if (IncludeColl(coll, member.Id))
                    merged.AddRange(DeserializeListSafe(getter(member)));
            }
            return merged;
        }

        primary.AliasesJson = JsonSerializer.Serialize(UnionColl("aliases", t => t.AliasesJson), JsonOpts.Default);
        primary.IdentityTagsJson = JsonSerializer.Serialize(UnionColl("identityTags", t => t.IdentityTagsJson), JsonOpts.Default);
        primary.RelatedIdsJson = JsonSerializer.Serialize(UnionColl("relatedIds", t => t.RelatedIdsJson), JsonOpts.Default);

        // ---------- 子记录集合：仅迁移被勾选记录的数据，修订记录始终迁移 ----------
        foreach (var sourceRecord in sourceRecords)
        {
            if (IncludeColl("spouses", sourceRecord.Id))
                foreach (var s in db.Spouses.Where(x => x.TraitorId == sourceRecord.Id)) s.TraitorId = primaryId;
            if (IncludeColl("children", sourceRecord.Id))
                foreach (var c in db.Children.Where(x => x.TraitorId == sourceRecord.Id)) c.TraitorId = primaryId;
            if (IncludeColl("residences", sourceRecord.Id))
                foreach (var r in db.Residences.Where(x => x.TraitorId == sourceRecord.Id)) r.TraitorId = primaryId;
            if (IncludeColl("crimeRecords", sourceRecord.Id))
                foreach (var c in db.CrimeRecords.Where(x => x.TraitorId == sourceRecord.Id)) c.TraitorId = primaryId;
            if (IncludeColl("lifeEvents", sourceRecord.Id))
                foreach (var e in db.LifeEvents.Where(x => x.TraitorId == sourceRecord.Id)) e.TraitorId = primaryId;
            if (IncludeColl("attachments", sourceRecord.Id))
                foreach (var a in db.Attachments.Where(x => x.TraitorId == sourceRecord.Id)) a.TraitorId = primaryId;
            if (IncludeColl("sources", sourceRecord.Id))
                foreach (var s in db.Sources.Where(x => x.TraitorId == sourceRecord.Id)) s.TraitorId = primaryId;
            foreach (var r in db.Revisions.Where(x => x.TraitorId == sourceRecord.Id)) r.TraitorId = primaryId;

            // 标记为已合并
            sourceRecord.MergedIntoId = primaryId;
            sourceRecord.MergedAt = DateTime.UtcNow;
        }

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
