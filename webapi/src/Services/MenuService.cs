using HanJianNet.WebApi.Common;

namespace HanJianNet.WebApi.Services;

public class MenuItemDto
{
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
}

/// <summary>
/// 菜单集中配置：每个菜单项声明可见角色，接口按当前用户角色过滤返回。
/// </summary>
public class MenuService
{
    private static readonly (MenuItemDto Item, string[] Roles)[] AllMenus =
    [
        (new MenuItemDto { Key = "reviews", Path = "/reviews", Label = "待审队列", Order = 1 },
            [Roles.Manager, Roles.Admin, Roles.SuperAdmin]),
        (new MenuItemDto { Key = "users", Path = "/users", Label = "用户管理", Order = 2 },
            [Roles.Admin, Roles.SuperAdmin]),
        (new MenuItemDto { Key = "profile", Path = "/profile", Label = "个人信息", Order = 3 },
            [Roles.Manager, Roles.Admin, Roles.SuperAdmin]),
    ];

    public List<MenuItemDto> GetMenusForRole(string role)
    {
        return AllMenus
            .Where(m => m.Roles.Contains(role))
            .OrderBy(m => m.Item.Order)
            .Select(m => m.Item)
            .ToList();
    }
}
