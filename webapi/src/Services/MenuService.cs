using System.Text.RegularExpressions;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// 菜单管理：菜单项存于数据库，每个菜单项声明可见角色，接口按当前用户角色过滤返回。
/// </summary>
public partial class MenuService(AppDbContext db)
{
    [GeneratedRegex("^[a-z][a-z0-9-]*$")]
    private static partial Regex KeyRegex();

    public async Task<List<MenuItemDto>> GetMenusForRoleAsync(string role)
    {
        var items = await db.MenuItems.OrderBy(m => m.Order).ThenBy(m => m.Key).ToListAsync();
        var visible = items.Where(m => ParseRoles(m.Roles).Contains(role)).ToList();

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
        var items = await db.MenuItems.OrderBy(m => m.Order).ThenBy(m => m.Key).ToListAsync();
        return items.Select(ToAdminDto).ToList();
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
            Order = req.Order,
            Roles = string.Join(',', roles),
            Parent = parent,
        };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        return ToAdminDto(item);
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

        if (item.Key != key)
        {
            // 分组改 Key 时同步子菜单的 Parent 引用，避免孤儿节点。
            var children = await db.MenuItems.Where(m => m.Parent == item.Key).ToListAsync();
            foreach (var child in children) child.Parent = key;
            item.Key = key;
        }
        item.Path = path;
        item.Label = label;
        item.Order = req.Order;
        item.Roles = string.Join(',', roles);
        item.Parent = parent;
        await db.SaveChangesAsync();
        return ToAdminDto(item);
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

    internal static string[] ParseRoles(string roles) =>
        roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    private static MenuItemDto ToDto(MenuItem m, List<MenuItem>? children = null) => new()
    {
        Key = m.Key,
        Path = m.Path,
        Label = m.Label,
        Order = m.Order,
        Children = (children ?? []).Select(c => ToDto(c)).ToList(),
    };

    private static MenuItemAdminDto ToAdminDto(MenuItem m) => new()
    {
        Id = m.Id,
        Key = m.Key,
        Path = m.Path,
        Label = m.Label,
        Order = m.Order,
        Roles = ParseRoles(m.Roles),
        Parent = m.Parent,
    };
}
