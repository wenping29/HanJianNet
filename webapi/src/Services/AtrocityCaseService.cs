using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>历史事件（惨案/宏观事件）。公开读取启用缓存，写入时自动失效。</summary>
public class AtrocityCaseService(AppDbContext db, CacheService cache)
{
    private const string CacheGroup = "atrocity-events";

    /// <summary>公开列表。可按 era 过滤；按年份升序、空年份置后。</summary>
    public async Task<List<AtrocityEventDto>> ListAsync(string? era = null)
    {
        var key = $"list:{era ?? ""}";
        return await cache.GetOrCreateAsync(CacheGroup, key, () => ListCoreAsync(era))
            ?? [];
    }

    private async Task<List<AtrocityEventDto>> ListCoreAsync(string? era)
    {
        var q = db.AtrocityCases.AsQueryable();
        if (!string.IsNullOrWhiteSpace(era))
        {
            var e = era!;
            q = q.Where(c => c.Era == e);
        }

        var items = await q
            .OrderBy(c => c.Year.HasValue ? 0 : 1)
            .ThenBy(c => c.Year)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync();
        return items.Select(c => c.ToDto()).ToList();
    }

    /// <summary>事件详情（含涉案人员）。</summary>
    public async Task<AtrocityEventDetailDto> GetAsync(string id)
    {
        var cached = await cache.GetOrCreateAsync(CacheGroup, $"get:{id}", () => GetCoreAsync(id));
        return cached ?? throw new ApiException(404, "事件不存在");
    }

    private async Task<AtrocityEventDetailDto?> GetCoreAsync(string id)
    {
        var item = await db.AtrocityCases
            .Include(c => c.Persons)
            .FirstOrDefaultAsync(c => c.Id == id);
        return item?.ToDetailDto();
    }

    /// <summary>新增事件（需登录）。</summary>
    public async Task<AtrocityEventDetailDto> CreateAsync(AtrocityEventInputDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
            throw new ApiException(400, "事件名称不能为空");

        var entity = input.ToEntity();

        db.AtrocityCases.Add(entity);
        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);
        return entity.ToDetailDto();
    }
}