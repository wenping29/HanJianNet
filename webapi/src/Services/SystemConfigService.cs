using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 系统配置服务：键值表，按 Category 分组。
/// 公开端点只返回 category="web" 的配置，admin 可查询/修改全部。
/// </summary>
public class SystemConfigService(AppDbContext db, CacheService cache)
{
    private const string CacheGroup = "systemconfig";
    private const string PublicCacheKey = "public";

    /// <summary>admin 用：返回全部配置项</summary>
    public async Task<List<SystemConfigDto>> ListAsync()
    {
        return await db.SystemConfigs
            .OrderBy(c => c.Category).ThenBy(c => c.Key)
            .Select(c => new SystemConfigDto
            {
                Id = c.Id,
                Key = c.Key,
                Value = c.Value,
                Category = c.Category,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
            })
            .ToListAsync();
    }

    /// <summary>web 用：只返回 category="web" 的 Key→Value 字典，走缓存</summary>
    public async Task<Dictionary<string, string>> GetPublicConfigAsync()
    {
        return (await cache.GetOrCreateAsync(CacheGroup, PublicCacheKey, async () =>
        {
            return await db.SystemConfigs
                .Where(c => c.Category == "web")
                .ToDictionaryAsync(c => c.Key, c => c.Value);
        })) ?? [];
    }

    /// <summary>更新配置值</summary>
    public async Task<SystemConfigDto?> UpdateAsync(string id, UpdateConfigRequest req)
    {
        var entity = await db.SystemConfigs.FindAsync(id);
        if (entity is null) return null;

        entity.Value = req.Value;
        if (req.Description is not null)
            entity.Description = req.Description;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.InvalidateAsync(CacheGroup);

        return new SystemConfigDto
        {
            Id = entity.Id,
            Key = entity.Key,
            Value = entity.Value,
            Category = entity.Category,
            Description = entity.Description,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
        };
    }
}
