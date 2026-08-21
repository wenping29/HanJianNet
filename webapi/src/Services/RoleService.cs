using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 角色管理：角色存于数据库（AppRoles），页面按「角色 × 菜单」矩阵配置各角色的菜单可见性。
/// 可见性数据仍存储于 MenuItem.Roles（逗号分隔），本服务做双向同步。
/// </summary>
public class RoleService(AppDbContext db)
{
    public async Task<List<RoleMenuDto>> ListAsync()
    {
        var menus = await db.MenuItems.OrderBy(m => m.Order).ThenBy(m => m.Key).ToListAsync();
        // 分组的可见性由子菜单自动推导，权限矩阵仅配置叶子菜单。
        var leafMenus = menus.Where(m => !menus.Any(c => c.Parent == m.Key)).ToList();
        var counts = await db.Users.GroupBy(u => u.Role)
            .ToDictionaryAsync(g => g.Key, g => g.Count());

        var items = new List<RoleMenuDto>();
        foreach (var role in await db.Roles.OrderByDescending(r => r.Rank).ThenBy(r => r.Key).ToListAsync())
        {
            items.Add(new RoleMenuDto
            {
                Role = role.Key,
                Label = role.Label,
                UserCount = counts.GetValueOrDefault(role.Key),
                MenuKeys = leafMenus
                    .Where(m => MenuService.ParseRoles(m.Roles).Contains(role.Key))
                    .Select(m => m.Key)
                    .ToArray(),
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
            .ToArray();

        var menus = await db.MenuItems.ToListAsync();
        var known = menus.Select(m => m.Key).ToHashSet();
        foreach (var key in keys)
        {
            if (!known.Contains(key)) throw new ApiException(400, $"未知菜单：{key}");
        }

        var keySet = keys.ToHashSet();
        foreach (var menu in menus)
        {
            var next = MenuService.ParseRoles(menu.Roles).Where(r => r != role).ToList();
            if (keySet.Contains(menu.Key)) next.Add(role);

            var joined = string.Join(',', next);
            if (joined != menu.Roles) menu.Roles = joined;
        }
        await db.SaveChangesAsync();
        return await ListAsync();
    }
}
