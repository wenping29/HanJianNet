using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Data;

/// <summary>
/// 数据库种子：内置角色、默认菜单、权限与角色-权限关联、超级管理员账号。
/// 全部以 Key 为准幂等执行，已存在的记录不会被覆盖（除 Rank/Sort 等基础属性）。
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IConfiguration config)
    {
        await SeedRolesAsync(db);
        await SeedMenusAndPermissionsAsync(db);
        await SeedWebMenusAsync(db);
        await SeedAdminAsync(db,
            config["Seed:AdminUsername"] ?? "admin",
            config["Seed:AdminEmail"] ?? "admin@hanjiannet.local",
            config["Seed:AdminPassword"] ?? "admin123456");

        if (config.GetValue<bool>("Seed:TestUsers"))
            await SeedTestUsersAsync(db);
    }

    /// <summary>种子内置角色：超管/管理员/管理/普通用户/游客。</summary>
    private static async Task SeedRolesAsync(AppDbContext db)
    {
        var defaults = new[]
        {
            new Role { Key = Roles.SuperAdmin, Name = "超级管理员", Sort = 4, IsBuiltIn = true, Description = "拥有全部权限，不可删除" },
            new Role { Key = Roles.Admin, Name = "管理员", Sort = 3, IsBuiltIn = true, Description = "系统管理，含用户/角色/菜单管理" },
            new Role { Key = Roles.Manager, Name = "管理", Sort = 2, IsBuiltIn = true, Description = "审核修订，可编辑档案" },
            new Role { Key = Roles.User, Name = "普通用户", Sort = 1, IsBuiltIn = true, Description = "提交修订，查看档案" },
            new Role { Key = Roles.Guest, Name = "游客", Sort = 0, IsBuiltIn = true, Description = "仅查看公开档案" },
        };

        foreach (var role in defaults)
        {
            var existing = await db.Roles.FirstOrDefaultAsync(r => r.Key == role.Key);
            if (existing is null)
            {
                db.Roles.Add(role);
            }
            else
            {
                existing.Name = role.Name;
                existing.Description = role.Description;
                existing.Sort = role.Sort;
                existing.IsBuiltIn = true;
            }
        }
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 种子默认菜单与权限：每条菜单对应一条权限（Key 相同）。
    /// 同时按角色初始化角色-权限关联：超管全部可见，管理员/管理按预设分配。
    /// 已有关联记录的菜单跳过，尊重后台配置。
    /// </summary>
    private static async Task SeedMenusAndPermissionsAsync(AppDbContext db)
    {
        // (key, path, label, sort, parent, visibleRoles)
        var defaults = new (string Key, string Path, string Label, int Sort, string? Parent, string[] VisibleRoles)[]
        {
            ("traitors", "/traitors", "名录管理", 1, null, ["admin", "superadmin"]),
            ("reviews", "/reviews", "待审队列", 2, null, ["manager", "admin", "superadmin"]),
            ("system", "/system", "系统管理", 3, null, ["manager", "admin", "superadmin"]),
            ("users", "/users", "用户管理", 1, "system", ["admin", "superadmin"]),
            ("roles", "/roles", "角色管理", 2, "system", ["admin", "superadmin"]),
            ("menus", "/menus", "菜单管理", 3, "system", ["admin", "superadmin"]),
            ("profile", "/profile", "个人信息", 4, "system", ["manager", "admin", "superadmin"]),
        };

        // 1) 菜单：缺则补，存在则修正 Parent/Sort（不改 Label/Path，尊重用户修改）
        foreach (var (key, path, label, sort, parent, _) in defaults)
        {
            var menu = await db.MenuItems.FirstOrDefaultAsync(m => m.Key == key);
            if (menu is null)
            {
                db.MenuItems.Add(new MenuItem
                {
                    Key = key,
                    Path = path,
                    Label = label,
                    Sort = sort,
                    Parent = parent,
                });
            }
            else if (menu.Parent != parent || menu.Sort != sort)
            {
                menu.Parent = parent;
                menu.Sort = sort;
            }
        }
        await db.SaveChangesAsync();

        // 2) 权限：每条菜单对应一条权限，Key 相同；缺则补，名变则改
        var menus = await db.MenuItems.ToListAsync();
        var permByKey = (await db.Permissions.ToListAsync()).ToDictionary(p => p.Key);
        foreach (var menu in menus)
        {
            if (permByKey.TryGetValue(menu.Key, out var perm))
            {
                if (perm.Name != menu.Label) perm.Name = menu.Label;
            }
            else
            {
                var p = new Permission { Key = menu.Key, Name = menu.Label, Group = "menu" };
                db.Permissions.Add(p);
                permByKey[menu.Key] = p;
            }
        }
        await db.SaveChangesAsync();

        // 3) 角色-权限关联：按菜单逐项补种
        //    若某菜单已有任何关联记录则跳过（尊重后台配置）；
        //    否则按默认可见角色回填。超管始终拥有全部权限，但关联记录中不写入超管，
        //    由服务层运行时判定（避免冗余数据）。
        var defaultRoleByKey = defaults.ToDictionary(d => d.Key, d => d.VisibleRoles);
        var rpByMenu = (await db.RolePermissions.ToListAsync())
            .GroupBy(rp => rp.PermissionKey)
            .ToDictionary(g => g.Key, g => g.Count());

        foreach (var menu in menus)
        {
            if (rpByMenu.GetValueOrDefault(menu.Key) > 0) continue;
            if (!defaultRoleByKey.TryGetValue(menu.Key, out var roles)) continue;
            foreach (var roleKey in roles)
                db.RolePermissions.Add(new RolePermission { RoleKey = roleKey, PermissionKey = menu.Key });
        }
        await db.SaveChangesAsync();
    }

    /// <summary>种子超级管理员账号：若已存在超管则跳过。</summary>
    private static async Task SeedAdminAsync(AppDbContext db, string username, string email, string password)
    {
        if (await db.Users.AnyAsync(u => u.Role == Roles.SuperAdmin)) return;
        if (await db.Users.AnyAsync(u => u.Username == username || u.Email == email)) return;

        db.Users.Add(new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = Roles.SuperAdmin,
        });
        await db.SaveChangesAsync();
    }

    /// <summary>种子测试账号便于联调。</summary>
    private static async Task SeedTestUsersAsync(AppDbContext db)
    {
        var testUsers = new (string Username, string Email, string Password, string Role)[]
        {
            ("testadmin", "testadmin@hanjiannet.local", "admin123456", Roles.Admin),
            ("testmanager", "testmanager@hanjiannet.local", "manager123456", Roles.Manager),
            ("testuser", "testuser@hanjiannet.local", "user123456", Roles.User),
            ("testguest", "testguest@hanjiannet.local", "guest123456", Roles.Guest),
        };

        foreach (var (username, email, password, role) in testUsers)
        {
            if (await db.Users.AnyAsync(u => u.Username == username || u.Email == email)) continue;
            db.Users.Add(new User
            {
                Username = username,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = role,
            });
        }
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 种子前台导航菜单：缺则补，存在则修正 Sort/IsEnabled（不改 Label/Path，尊重用户修改）。
    /// </summary>
    private static async Task SeedWebMenusAsync(AppDbContext db)
    {
        var defaults = new[]
        {
            new WebMenu { Key = "home",     Path = "/",          Label = "首页",     Sort = 1, IsEnabled = true },
            new WebMenu { Key = "lookup",   Path = "/lookup",    Label = "查询",     Sort = 2, IsEnabled = true },
            new WebMenu { Key = "map",      Path = "/map",       Label = "汉奸地图", Sort = 3, IsEnabled = true },
            new WebMenu { Key = "timeline", Path = "/timeline",  Label = "时光轴",   Sort = 4, IsEnabled = true },
            new WebMenu { Key = "roster",   Path = "/roster",    Label = "名录",     Sort = 5, IsEnabled = true },
            new WebMenu { Key = "events",   Path = "/events",    Label = "事件",     Sort = 6, IsEnabled = true },
            new WebMenu { Key = "about",    Path = "/about",     Label = "关于",     Sort = 7, IsEnabled = true },
        };

        foreach (var menu in defaults)
        {
            var existing = await db.WebMenus.FirstOrDefaultAsync(m => m.Key == menu.Key);
            if (existing is null)
            {
                db.WebMenus.Add(menu);
            }
            else
            {
                existing.Sort = menu.Sort;
                // 不覆盖 IsEnabled，尊重用户在数据库中的启停配置
            }
        }
        await db.SaveChangesAsync();
    }
}
