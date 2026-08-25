using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 角色管理：角色存于数据库（Roles 表），角色与菜单的可见性关联以 RolePermissions 表为准。
/// 超级管理员默认可见全部菜单（运行时判定，不写入关联表）。
/// </summary>
public class RoleService(AppDbContext db)
{
    public async Task<List<RoleMenuDto>> ListAsync()
    {
        var menus = await db.MenuItems.OrderBy(m => m.Sort).ThenBy(m => m.Key).ToListAsync();
        var allKeys = menus.Select(m => m.Key).ToHashSet();

        var counts = await db.Users.GroupBy(u => u.Role)
            .ToDictionaryAsync(g => g.Key, g => g.Count());

        // 一次性取出全部角色-权限关联，按角色分组
        var menuKeysByRole = (await db.RolePermissions.ToListAsync())
            .GroupBy(rp => rp.RoleKey)
            .ToDictionary(g => g.Key, g => g.Select(rp => rp.PermissionKey).ToHashSet());

        var roles = await db.Roles.OrderByDescending(r => r.Sort).ThenBy(r => r.Key).ToListAsync();
        var items = new List<RoleMenuDto>();
        foreach (var role in roles)
        {
            // 超级管理员默认可见全部菜单
            var keys = role.Key == Roles.SuperAdmin
                ? allKeys
                : menuKeysByRole.GetValueOrDefault(role.Key) ?? new HashSet<string>();

            items.Add(new RoleMenuDto
            {
                Role = role.Key,
                Label = role.Name,
                UserCount = counts.GetValueOrDefault(role.Key),
                MenuKeys = keys.ToArray(),
            });
        }
        return items;
    }

    public async Task<List<RoleMenuDto>> SetMenusAsync(string role, string[] menuKeys)
    {
        role = role.Trim().ToLowerInvariant();
        _ = await db.Roles.FirstOrDefaultAsync(r => r.Key == role)
            ?? throw new ApiException(400, $"未知角色：{role}");
        if (role == Roles.SuperAdmin) throw new ApiException(400, "超级管理员默认可见所有菜单，无需配置");

        var keys = menuKeys
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k.Trim())
            .Distinct()
            .ToHashSet();

        var known = await db.MenuItems.Select(m => m.Key).ToListAsync();
        foreach (var key in keys)
        {
            if (!known.Contains(key)) throw new ApiException(400, $"未知菜单：{key}");
        }

        // 替换该角色的全部 RolePermissions 记录
        var existing = await db.RolePermissions.Where(rp => rp.RoleKey == role).ToListAsync();
        db.RolePermissions.RemoveRange(existing);

        foreach (var key in keys)
            db.RolePermissions.Add(new RolePermission { RoleKey = role, PermissionKey = key });

        await db.SaveChangesAsync();
        return await ListAsync();
    }
}
