using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>档案相关操作。公开读取（列表/详情/统计）启用分布式缓存，写入时自动失效。</summary>
public class TraitorService(IWebHostEnvironment env, AppDbContext db, CacheService cache)
{
    private const string CacheGroup = "traitors";

    /// <summary>
    /// 公开列表查询。page/pageSize 未指定时返回全量（供地图统计等场景使用），指定时返回分页结果。
    /// cursor 非 null 时走 Keyset 游标分页（空串 = 第一页）：不做 COUNT、不做大 OFFSET，深翻页性能与页码无关；
    /// 响应 Total=-1（未知）、Page=0，通过 NextCursor 续翻。页码模式行为不变，深页结果同样走 Redis 缓存。
    /// </summary>
    public async Task<PagedResult<TraitorSummaryDto>> ListAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? page = null, int? pageSize = null, string? cursor = null)
    {
        // 缓存范围收敛：
        // - 页码模式只缓存前 MaxCachedListPage 页，深页命中率极低，直连 MySQL 避免爬虫翻页撑爆 Redis；
        // - 游标模式只缓存第一页（cursor 为空），深游标页走 Keyset 查询代价本就恒定且低；
        // - 全量分支（地图页）保留缓存，大 value 由 CacheService 透明 gzip 压缩。
        var cacheable = cursor is not null
            ? cursor.Length == 0
            : !page.HasValue || page.Value <= cache.MaxCachedListPage;
        if (!cacheable)
            return await ListCoreAsync(name, yearFrom, yearTo, @event, period, province, page, pageSize, cursor);

        return await cache.GetOrCreateAsync(
                CacheGroup,
                BuildListKey(name, yearFrom, yearTo, @event, period, province, page, pageSize, cursor),
                () => ListCoreAsync(name, yearFrom, yearTo, @event, period, province, page, pageSize, cursor),
                cache.ListExpiry)
            ?? new PagedResult<TraitorSummaryDto>([], 0, 1, 10);
    }

    /// <summary>
    /// 列表缓存 key：过滤值 Trim 后拼接；长度超 200 时参数段整体取 MD5，保证 key 长度有界。
    /// </summary>
    private static string BuildListKey(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? page, int? pageSize, string? cursor)
    {
        var paramPart = string.Join("|",
            name?.Trim() ?? "", yearFrom?.ToString() ?? "", yearTo?.ToString() ?? "",
            @event?.Trim() ?? "", period?.Trim() ?? "", province?.Trim() ?? "",
            page?.ToString() ?? "", pageSize?.ToString() ?? "",
            cursor is null ? "" : $"c:{cursor}");
        if (paramPart.Length <= 200)
            return $"list:{paramPart}";
        var hash = Convert.ToHexString(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(paramPart)));
        return $"list:h:{hash}";
    }

    private Task<PagedResult<TraitorSummaryDto>> ListCoreAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? page = null, int? pageSize = null, string? cursor = null)
        => cursor is not null
            ? ListCursorCoreAsync(name, yearFrom, yearTo, @event, period, province, pageSize, cursor)
            : ListOffsetCoreAsync(name, yearFrom, yearTo, @event, period, province, page, pageSize);

    /// <summary>公开列表的过滤条件（Offset 与 Cursor 两种分页共用）。</summary>
    private IQueryable<Entities.Traitor> ApplyListFilters(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province)
    {
        // 只读列表：不进入 ChangeTracker，降低每请求内存占用
        var q = db.Traitors.AsNoTracking();

        // 已下架档案不在前台公开展示（应对内容投诉）
        q = q.Where(t => !t.IsHidden);

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
        return q;
    }

    /// <summary>
    /// 固定排序：危害等级升序（1=特级 最严重在前），未分级排最后；同级按创建时间倒序，Id 升序终判。
    /// Keyset 游标分页依赖该全序（任何两行都能分出先后）。
    /// </summary>
    private static IOrderedQueryable<Entities.Traitor> ApplyListOrdering(IQueryable<Entities.Traitor> q)
        => q.OrderBy(t => t.HarmLevel == null ? 1 : 0)
            .ThenBy(t => t.HarmLevel)
            .ThenByDescending(t => t.CreatedAt)
            .ThenBy(t => t.Id);

    private async Task<PagedResult<TraitorSummaryDto>> ListOffsetCoreAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? page = null, int? pageSize = null)
    {
        var q = ApplyListOrdering(ApplyListFilters(name, yearFrom, yearTo, @event, period, province));

        var total = await q.CountAsync();
        // 犯罪记录条数与头像 URL 在 SQL 侧聚合，避免把明细全部读入内存与 N+1 查询
        if (page.HasValue && pageSize.HasValue)
        {
            var p = Math.Max(1, page.Value);
            var ps = Math.Clamp(pageSize.Value, 1, 200);
            var rows = await q.Skip((p - 1) * ps).Take(ps)
                .Select(t => new
                {
                    Traitor = t,
                    CrimeCount = t.CrimeRecords.Count,
                    PhotoUrl = t.Attachments.Where(a => a.Kind == "photo").Select(a => a.Url).FirstOrDefault(),
                })
                .ToListAsync();
            return new PagedResult<TraitorSummaryDto>(
                Items: rows.Select(r =>
                {
                    var dto = r.Traitor.ToSummary(r.CrimeCount);
                    dto.PhotoUrl = r.PhotoUrl;
                    return dto;
                }).ToList(),
                Total: total,
                Page: p,
                PageSize: ps)
            {
                // 附带本页末行游标，便于客户端"页码跳转后转游标续翻"
                NextCursor = rows.Count > 0 && (long)p * ps < total ? EncodeCursor(rows[^1].Traitor) : null,
            };
        }
        else
        {
            var rows = await q
                .Select(t => new
                {
                    Traitor = t,
                    CrimeCount = t.CrimeRecords.Count,
                    PhotoUrl = t.Attachments.Where(a => a.Kind == "photo").Select(a => a.Url).FirstOrDefault(),
                })
                .ToListAsync();
            return new PagedResult<TraitorSummaryDto>(
                Items: rows.Select(r =>
                {
                    var dto = r.Traitor.ToSummary(r.CrimeCount);
                    dto.PhotoUrl = r.PhotoUrl;
                    return dto;
                }).ToList(),
                Total: total,
                Page: 1,
                PageSize: Math.Max(1, total));
        }
    }

    /// <summary>
    /// Keyset 游标分页：WHERE 谓词直接定位到游标行之后，不做 COUNT 与大 OFFSET，深翻页代价恒定。
    /// cursor 为空串表示第一页。约定返回 Total=-1（未知）、Page=0；NextCursor 为 null 表示没有下一页。
    /// </summary>
    private async Task<PagedResult<TraitorSummaryDto>> ListCursorCoreAsync(string? name, int? yearFrom, int? yearTo, string? @event, string? period, string? province, int? pageSize, string cursor)
    {
        var ps = Math.Clamp(pageSize ?? 20, 1, 200);
        var q = ApplyListFilters(name, yearFrom, yearTo, @event, period, province);

        if (!string.IsNullOrEmpty(cursor))
        {
            var (harmLevel, createdAtTicks, id) = DecodeCursor(cursor);
            var createdAt = new DateTime(createdAtTicks, DateTimeKind.Utc);
            if (harmLevel is int h)
            {
                // 排序序：(HarmLevel asc 空值最后, CreatedAt desc, Id asc) —— 取"游标行之后"的行
                q = q.Where(t =>
                    t.HarmLevel == null
                    || t.HarmLevel > h
                    || (t.HarmLevel == h && t.CreatedAt < createdAt)
                    || (t.HarmLevel == h && t.CreatedAt == createdAt && string.Compare(t.Id, id) > 0));
            }
            else
            {
                // 游标行在未分级组（排在最后）：只需在未分级组内继续
                q = q.Where(t =>
                    t.HarmLevel == null
                    && (t.CreatedAt < createdAt
                        || (t.CreatedAt == createdAt && string.Compare(t.Id, id) > 0)));
            }
        }

        q = ApplyListOrdering(q);

        // 多取 1 行判断是否还有下一页
        var rows = await q.Take(ps + 1)
            .Select(t => new
            {
                Traitor = t,
                CrimeCount = t.CrimeRecords.Count,
                PhotoUrl = t.Attachments.Where(a => a.Kind == "photo").Select(a => a.Url).FirstOrDefault(),
            })
            .ToListAsync();

        var hasMore = rows.Count > ps;
        if (hasMore) rows.RemoveAt(rows.Count - 1);

        return new PagedResult<TraitorSummaryDto>(
            Items: rows.Select(r =>
            {
                var dto = r.Traitor.ToSummary(r.CrimeCount);
                dto.PhotoUrl = r.PhotoUrl;
                return dto;
            }).ToList(),
            Total: -1,
            Page: 0,
            PageSize: ps)
        {
            NextCursor = hasMore && rows.Count > 0 ? EncodeCursor(rows[^1].Traitor) : null,
        };
    }

    /// <summary>游标编码：base64url("{harmLevel或空}|{createdAt.Ticks}|{id}")。</summary>
    private static string EncodeCursor(Entities.Traitor t)
    {
        var raw = $"{t.HarmLevel?.ToString() ?? ""}|{t.CreatedAt.Ticks}|{t.Id}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(raw))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    /// <summary>游标解码；格式非法时抛 <see cref="ArgumentException"/>（由 Controller 转为 400）。</summary>
    private static (int? HarmLevel, long CreatedAtTicks, string Id) DecodeCursor(string cursor)
    {
        try
        {
            var raw = System.Text.Encoding.UTF8.GetString(
                Convert.FromBase64String(cursor.Replace('-', '+').Replace('_', '/').PadRight(cursor.Length + (4 - cursor.Length % 4) % 4, '=')));
            var parts = raw.Split('|');
            if (parts.Length != 3 || !long.TryParse(parts[1], out var ticks) || string.IsNullOrEmpty(parts[2]))
                throw new FormatException("bad cursor parts");
            int? harmLevel = string.IsNullOrEmpty(parts[0]) ? null : int.Parse(parts[0]);
            return (harmLevel, ticks, parts[2]);
        }
        catch (Exception ex) when (ex is FormatException or OverflowException)
        {
            throw new ArgumentException("非法的分页游标", nameof(cursor));
        }
    }

    public async Task<TraitorDto> GetAsync(string id)
    {
        var cached = await cache.GetOrCreateAsync(CacheGroup, $"get:{id}", () => GetCoreAsync(id, includeHidden: false), cache.DetailExpiry);
        return cached ?? throw new ApiException(404, "档案不存在");
    }

    private async Task<TraitorDto?> GetCoreAsync(string id, bool includeHidden)
    {
        var q = WithIncludes().AsNoTracking();
        // 前台详情：已下架档案不可见（返回 404）
        if (!includeHidden) q = q.Where(t => !t.IsHidden);
        var t = await q.FirstOrDefaultAsync(t => t.Id == id);
        return t?.ToDto();
    }

    public async Task<List<RevisionDto>> GetRevisionsAsync(string traitorId)
    {
        // 已下架 / 不存在档案不公开其修订历史
        var visible = await db.Traitors.AsNoTracking().AnyAsync(t => t.Id == traitorId && !t.IsHidden);
        if (!visible) return [];

        var items = await db.Revisions
            .AsNoTracking()
            .Where(r => r.TraitorId == traitorId)
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();
        return items.Select(r => r.ToDto()).ToList();
    }

    public async Task<TraitorStatsDto> GetStatsAsync()
    {
        return await cache.GetOrCreateAsync(CacheGroup, "stats", StatsCoreAsync, cache.StatsExpiry)
            ?? new TraitorStatsDto();
    }

    private async Task<TraitorStatsDto> StatsCoreAsync()
    {
        var rows = await db.Traitors
            .Where(t => !t.IsHidden)
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
        var sentenced = await db.Traitors.CountAsync(t => !t.IsHidden && t.CrimeRecords.Any());
        // 子女信息数：有子女记录的档案数
        var childrenInfo = await db.Traitors.CountAsync(t => !t.IsHidden && t.Children.Any());
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
        return await cache.GetOrCreateAsync(CacheGroup, "province-stats", ProvinceStatsCoreAsync, cache.StatsExpiry)
            ?? new ProvinceStatsDto();
    }

    private async Task<ProvinceStatsDto> ProvinceStatsCoreAsync()
    {
        var provinces = await db.Traitors.Where(t => !t.IsHidden).Select(t => t.Province ?? "").ToListAsync();
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
        return await cache.GetOrCreateAsync(CacheGroup, "timeline", TimelineCoreAsync, cache.StatsExpiry)
            ?? [];
    }

    private async Task<List<TimelineItemDto>> TimelineCoreAsync()
    {
        var items = await db.LifeEvents
            .Include(e => e.Traitor)
            .Where(e => e.Year != null && !e.Traitor.IsHidden)
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
        var loaded = await WithIncludes().AsNoTracking().FirstAsync(t => t.Id == traitor.Id);
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

    public async Task<PagedResult<TraitorSummaryDto>> AdminListAsync(string? name, int? harmLevel, bool? hasPhoto, int page = 1, int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 1000) pageSize = 1000;
        var q = db.Traitors.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(name))
        {
            var n = name!;
            q = q.Where(t => t.Name.Contains(n));
        }
        if (harmLevel is int hl)
            q = q.Where(t => t.HarmLevel == hl);
        if (hasPhoto is bool hp)
        {
            if (hp)
                q = q.Where(t => t.Attachments.Any(a => a.Kind == "photo"));
            else
                q = q.Where(t => !t.Attachments.Any(a => a.Kind == "photo"));
        }
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
                PhotoUrl = t.Attachments.Where(a => a.Kind == "photo").Select(a => a.Url).FirstOrDefault(),
                Titles = t.CrimeRecords
                    .Where(c => !string.IsNullOrWhiteSpace(c.Title))
                    .Select(c => c.Title)
                    .Take(10)
                    .ToList(),
            })
            .ToListAsync();
        return new PagedResult<TraitorSummaryDto>(
            Items: rows.Select(r =>
            {
                var dto = r.T.ToSummary(r.Titles.Count, r.Titles);
                dto.PhotoUrl = r.PhotoUrl;
                return dto;
            }).ToList(),
            Total: total,
            Page: page,
            PageSize: pageSize);
    }

    public async Task<TraitorDto> AdminGetAsync(string id)
    {
        // 管理员读取详情：不排除已下架档案，便于查看/恢复
        var t = await GetCoreAsync(id, includeHidden: true);
        return t ?? throw new ApiException(404, "档案不存在");
    }

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
    /// 删除指定档案的全部照片：清除 Attachments 中 kind=photo 的记录，并同步删除 uploads 目录下对应的本地文件。
    /// </summary>
    public async Task<int> AdminDeletePhotosAsync(string id)
    {
        var traitor = await db.Traitors.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id)
                      ?? throw new ApiException(404, "档案不存在");
        var photos = await db.Attachments.Where(a => a.TraitorId == id && a.Kind == "photo").ToListAsync();
        if (photos.Count == 0)
            return 0;

        db.Attachments.RemoveRange(photos);
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);

        var uploadRoot = Path.Combine(env.ContentRootPath, "uploads");
        foreach (var photo in photos)
        {
            // 仅清理本地上传文件（/uploads/xxx），远程直链（http(s)://）无法也不应删除
            if (string.IsNullOrWhiteSpace(photo.Url) || !photo.Url.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
                continue;
            var fileName = Path.GetFileName(photo.Url);
            if (string.IsNullOrWhiteSpace(fileName))
                continue;
            var filePath = Path.Combine(uploadRoot, fileName);
            try
            {
                if (File.Exists(filePath))
                    File.Delete(filePath);
            }
            catch
            {
                // 文件删除失败不影响数据库记录清理
            }
        }
        return photos.Count;
    }

    /// <summary>更新档案危害等级。</summary>
    public async Task AdminUpdateHarmLevelAsync(string id, int? harmLevel)
    {
        var traitor = await db.Traitors.FirstOrDefaultAsync(t => t.Id == id)
                      ?? throw new ApiException(404, "档案不存在");
        if (harmLevel is int hl && (hl < 1 || hl > 7))
            throw new ApiException(400, "危害等级取值应为 1-7 或留空");
        traitor.HarmLevel = harmLevel;
        traitor.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
    }

    /// <summary>
    /// 下架/恢复档案：下架后档案不在前台公开展示（应对内容投诉），恢复即重新上架。
    /// 记录下架原因/时间/操作人，便于留痕追溯。
    /// </summary>
    public async Task<TraitorDto> AdminSetHiddenAsync(string id, bool hidden, string? reason, string operatorUsername)
    {
        var traitor = await WithIncludes().FirstOrDefaultAsync(t => t.Id == id)
                      ?? throw new ApiException(404, "档案不存在");
        traitor.IsHidden = hidden;
        if (hidden)
        {
            traitor.HiddenReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
            traitor.HiddenAt = DateTime.UtcNow;
            traitor.HiddenBy = string.IsNullOrWhiteSpace(operatorUsername) ? null : operatorUsername;
        }
        else
        {
            traitor.HiddenReason = null;
            traitor.HiddenAt = null;
            traitor.HiddenBy = null;
        }
        traitor.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
        return traitor.ToDto();
    }

    /// <summary>
    /// 批量删除档案：仅删除指定的 Id 列表中实际存在的记录；任一被选记录作为合并目标被引用（MergedIntoId）时整批拒绝。
    /// 子记录由数据库级联删除。
    /// </summary>
    public async Task<int> AdminBatchDeleteAsync(IReadOnlyCollection<string> ids)
    {
        var idSet = (ids ?? []).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToHashSet();
        if (idSet.Count == 0)
            throw new ApiException(400, "未选择任何档案");

        var traitors = await db.Traitors.Where(t => idSet.Contains(t.Id)).ToListAsync();
        if (traitors.Count == 0)
            throw new ApiException(404, "档案不存在");

        // 任一被选记录被其他档案作为合并目标引用时拒绝整批删除，保持数据完整
        var referenced = await db.Traitors
            .Where(t => t.MergedIntoId != null && idSet.Contains(t.MergedIntoId))
            .Select(t => t.MergedIntoId)
            .Distinct()
            .ToListAsync();
        if (referenced.Count > 0)
            throw new ApiException(409, "所选档案中有被其他档案合并引用的记录，请先解除合并后再删除");

        db.Traitors.RemoveRange(traitors);
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
        return traitors.Count;
    }

    /// <summary>
    /// 批量删除所选档案的全部照片：清除 Attachments 中 kind=photo 的记录并删除 uploads 目录下的本地文件。
    /// 返回受影响（至少删除了一张照片）的档案数。
    /// </summary>
    public async Task<int> AdminBatchDeletePhotosAsync(IReadOnlyCollection<string> ids)
    {
        var idSet = (ids ?? []).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToHashSet();
        if (idSet.Count == 0)
            throw new ApiException(400, "未选择任何档案");

        var photos = await db.Attachments
            .Where(a => a.Kind == "photo" && idSet.Contains(a.TraitorId))
            .ToListAsync();
        if (photos.Count == 0)
            throw new ApiException(404, "所选档案均无照片");

        db.Attachments.RemoveRange(photos);
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);

        var uploadRoot = Path.Combine(env.ContentRootPath, "uploads");
        var fileName = "";
        foreach (var photo in photos)
        {
            if (string.IsNullOrWhiteSpace(photo.Url) || !photo.Url.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
                continue;
            fileName = Path.GetFileName(photo.Url);
            if (string.IsNullOrWhiteSpace(fileName))
                continue;
            var filePath = Path.Combine(uploadRoot, fileName);
            try
            {
                if (File.Exists(filePath))
                    File.Delete(filePath);
            }
            catch
            {
                // 文件删除失败不影响数据库记录清理
            }
        }
        return photos.Select(p => p.TraitorId).Distinct().Count();
    }

    /// <summary>
    /// 批量导出：按 Id 列表返回包含照片地址的档案概要。ids 为空时返回全量（供无选择场景全量导出）。
    /// </summary>
    public async Task<List<TraitorSummaryDto>> AdminExportAsync(IReadOnlyCollection<string> ids)
    {
        var idSet = (ids ?? []).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().ToHashSet();
        var q = db.Traitors.AsNoTracking();
        if (idSet.Count > 0)
            q = q.Where(t => idSet.Contains(t.Id));
        var rows = await q
            .OrderBy(t => t.HarmLevel == null ? 1 : 0)
            .ThenBy(t => t.HarmLevel)
            .ThenBy(t => t.Name)
            .ThenByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                T = t,
                PhotoUrl = t.Attachments.Where(a => a.Kind == "photo").Select(a => a.Url).FirstOrDefault(),
                Titles = t.CrimeRecords
                    .Where(c => !string.IsNullOrWhiteSpace(c.Title))
                    .Select(c => c.Title)
                    .Take(10)
                    .ToList(),
            })
            .ToListAsync();
        return rows.Select(r =>
        {
            var dto = r.T.ToSummary(r.Titles.Count, r.Titles);
            dto.PhotoUrl = r.PhotoUrl;
            return dto;
        }).ToList();
    }

    /// <summary>
    /// 查找重复记录：按 Name + NativePlace 分组，仅返回未合并（MergedIntoId == null）且 Count > 1 的组。
    /// 可选 name/nativePlace 过滤。
    /// </summary>
    public async Task<List<DuplicateGroupDto>> FindDuplicatesAsync(string? name, string? nativePlace)
    {
        var q = db.Traitors.AsNoTracking();
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
