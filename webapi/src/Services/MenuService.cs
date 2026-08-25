using System.Text.RegularExpressions;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 菜单管理：菜单项存于数据库，菜单 Key 即权限 Key。
/// 菜单可见性以 RolePermissions 表为准（超管可见全部）。
/// </summary>
public partial class MenuService(AppDbContext db)
{
    [GeneratedRegex("^[a-z][a-z0-9-]*$")]
    private static partial Regex KeyRegex();

    public async Task<List<MenuItemDto>> GetMenusForRoleAsync(string role)
    {
        var items = await db.MenuItems.OrderBy(m => m.Sort).ThenBy(m => m.Key).ToListAsync();

        // 超级管理员可见全部；其他角色按 RolePermissions 表过滤
        HashSet<string> visibleKeys;
        if (role == Roles.SuperAdmin)
        {
            visibleKeys = items.Select(m => m.Key).ToHashSet();
        }
        else
        {
            visibleKeys = (await db.RolePermissions
                .Where(rp => rp.RoleKey == role)
                .Select(rp => rp.PermissionKey)
                .ToListAsync()).ToHashSet();
        }

        var visible = items.Where(m => visibleKeys.Contains(m.Key)).ToList();

        // 子菜单按自身角色过滤后挂到父级；父级只要存在可见子菜单即视为可见。
        var childrenByParent = visible
            .Where(m => !string.IsNullOrEmpty(m.Parent))
            .GroupBy(m => m.Parent!)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<MenuItemDto>();
        var consumedParents = new HashSet<string>();

        foreach (var top in visible.Where(m => string.IsNullOrEmpty(m.Parent)))
        {
            childrenByParent.TryGetValue(top.Key, out var kids);
            result.Add(ToDto(top, kids));
            if (kids is not null) consumedParents.Add(top.Key);
        }

        foreach (var (parentKey, kids) in childrenByParent)
        {
            if (consumedParents.Contains(parentKey)) continue;
            var parent = items.FirstOrDefault(m => m.Key == parentKey);
            if (parent is not null)
                result.Add(ToDto(parent, kids));
            else
                result.AddRange(kids.Select(k => ToDto(k))); // 父级已删除：孤儿子菜单提升为顶级
        }

        return result.OrderBy(m => m.Order).ThenBy(m => m.Key).ToList();
    }

    public async Task<List<MenuItemAdminDto>> ListAsync()
    {
        var items = await db.MenuItems.OrderBy(m => m.Sort).ThenBy(m => m.Key).ToListAsync();
        // 可见角色以 RolePermissions 表为准
        var rolePerms = await db.RolePermissions.ToListAsync();
        var rolesByMenu = rolePerms
            .GroupBy(rp => rp.PermissionKey)
            .ToDictionary(g => g.Key, g => g.Select(rp => rp.RoleKey).ToArray());

        return items.Select(m => ToAdminDto(m, rolesByMenu.GetValueOrDefault(m.Key) ?? [])).ToList();
    }

    public async Task<MenuItemAdminDto> CreateAsync(SaveMenuRequest req)
    {
        var (key, path, label, roles, parent) = await NormalizeAsync(req);

        if (await db.MenuItems.AnyAsync(m => m.Key == key))
            throw new ApiException(409, $"菜单标识「{key}」已存在");
        if (await db.MenuItems.AnyAsync(m => m.Path == path))
            throw new ApiException(409, $"菜单路径「{path}」已存在");

        var item = new MenuItem
        {
            Key = key,
            Path = path,
            Label = label,
            Sort = req.Order,
            Parent = parent,
        };
        db.MenuItems.Add(item);

        // 同步权限表
        if (!await db.Permissions.AnyAsync(p => p.Key == key))
            db.Permissions.Add(new Permission { Key = key, Name = label });

        // 同步角色-权限关联
        foreach (var r in roles)
            db.RolePermissions.Add(new RolePermission { RoleKey = r, PermissionKey = key });

        await db.SaveChangesAsync();
        return ToAdminDto(item, roles);
    }

    public async Task<MenuItemAdminDto> UpdateAsync(string id, SaveMenuRequest req)
    {
        var item = await db.MenuItems.FindAsync(id)
                   ?? throw new ApiException(404, "菜单不存在");

        var (key, path, label, roles, parent) = await NormalizeAsync(req);

        if (await db.MenuItems.AnyAsync(m => m.Key == key && m.Id != id))
            throw new ApiException(409, $"菜单标识「{key}」已存在");
        if (await db.MenuItems.AnyAsync(m => m.Path == path && m.Id != id))
            throw new ApiException(409, $"菜单路径「{path}」已存在");
        if (!string.IsNullOrEmpty(parent) && await db.MenuItems.AnyAsync(m => m.Parent == item.Key))
            throw new ApiException(400, "该菜单包含子菜单，不能移入其他分组");

        var oldKey = item.Key;
        if (oldKey != key)
        {
            // 分组改 Key 时同步子菜单的 Parent 引用，避免孤儿节点。
            var children = await db.MenuItems.Where(m => m.Parent == oldKey).ToListAsync();
            foreach (var child in children) child.Parent = key;

            // 同步 RolePermissions.PermissionKey
            var oldPerms = await db.RolePermissions.Where(rp => rp.PermissionKey == oldKey).ToListAsync();
            db.RolePermissions.RemoveRange(oldPerms);
            foreach (var rp in oldPerms)
                db.RolePermissions.Add(new RolePermission { RoleKey = rp.RoleKey, PermissionKey = key });

            // 同步 Permissions.Key
            var permission = await db.Permissions.FirstOrDefaultAsync(p => p.Key == oldKey);
            if (permission is not null) permission.Key = key;
        }

        item.Key = key;
        item.Path = path;
        item.Label = label;
        item.Sort = req.Order;
        item.Parent = parent;

        // 同步权限名称
        var perm = await db.Permissions.FirstOrDefaultAsync(p => p.Key == key);
        if (perm is null)
        {
            db.Permissions.Add(new Permission { Key = key, Name = label });
        }
        else if (perm.Name != label)
        {
            perm.Name = label;
        }

        // 重置该菜单的角色-权限关联
        var existing = await db.RolePermissions.Where(rp => rp.PermissionKey == key).ToListAsync();
        db.RolePermissions.RemoveRange(existing);
        foreach (var r in roles)
            db.RolePermissions.Add(new RolePermission { RoleKey = r, PermissionKey = key });

        await db.SaveChangesAsync();
        return ToAdminDto(item, roles);
    }

    // ---------- 内部 ----------

    private async Task<(string Key, string Path, string Label, string[] Roles, string? Parent)> NormalizeAsync(SaveMenuRequest req)
    {
        var key = req.Key.Trim().ToLowerInvariant();
        var path = req.Path.Trim();
        var label = req.Label.Trim();
        var roles = req.Roles
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r.Trim().ToLowerInvariant())
            .Distinct()
            .ToArray();

        if (key.Length < 2) throw new ApiException(400, "菜单标识至少 2 个字符");
        if (!KeyRegex().IsMatch(key)) throw new ApiException(400, "菜单标识仅限小写字母、数字和中划线，且以字母开头");
        if (!path.StartsWith('/')) throw new ApiException(400, "菜单路径必须以 / 开头");
        if (label.Length < 2) throw new ApiException(400, "菜单名称至少 2 个字符");
        if (req.Order < 0) throw new ApiException(400, "排序值不能为负数");
        if (roles.Length == 0) throw new ApiException(400, "至少选择一个可见角色");

        var validRoles = (await db.Roles.Select(r => r.Key).ToListAsync()).ToHashSet();
        foreach (var role in roles)
        {
            if (!validRoles.Contains(role)) throw new ApiException(400, $"未知角色：{role}");
        }

        string? parent = null;
        if (!string.IsNullOrWhiteSpace(req.Parent))
        {
            parent = req.Parent.Trim();
            if (parent == key) throw new ApiException(400, "不能将菜单设为自身的子菜单");
            var parentItem = await db.MenuItems.FirstOrDefaultAsync(m => m.Key == parent)
                             ?? throw new ApiException(400, $"上级菜单不存在：{parent}");
            if (!string.IsNullOrEmpty(parentItem.Parent))
                throw new ApiException(400, "仅支持两级菜单，不能选择二级菜单作为上级");
        }

        return (key, path, label, roles, parent);
    }

    private static MenuItemDto ToDto(MenuItem m, List<MenuItem>? children = null) => new()
    {
        Key = m.Key,
        Path = m.Path,
        Label = m.Label,
        Order = m.Sort,
        Children = (children ?? []).Select(c => ToDto(c)).ToList(),
    };

    private static MenuItemAdminDto ToAdminDto(MenuItem m, string[] roles) => new()
    {
        Id = m.Id,
        Key = m.Key,
        Path = m.Path,
        Label = m.Label,
        Order = m.Sort,
        Roles = roles,
        Parent = m.Parent,
    };
}
