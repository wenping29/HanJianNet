using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(AppDbContext db, string username, string email, string password)
    {
        // 旧库升级：存在 admin 但无超级管理员时，将首个 admin 提升为 superadmin。
        if (!await db.Users.AnyAsync(u => u.Role == Roles.SuperAdmin))
        {
            var legacyAdmin = await db.Users
                .Where(u => u.Role == Roles.Admin)
                .OrderBy(u => u.CreatedAt)
                .FirstOrDefaultAsync();
            if (legacyAdmin is not null)
            {
                legacyAdmin.Role = Roles.SuperAdmin;
                await db.SaveChangesAsync();
                return;
            }
        }

        if (await db.Users.AnyAsync(u => u.Role == Roles.SuperAdmin || u.Role == Roles.Admin)) return;

        db.Users.Add(new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = Roles.SuperAdmin,
        });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 按角色写入测试账号便于联调（superadmin 已由 SeedAdminAsync 提供）；已存在同名用户或邮箱时跳过。
    /// </summary>
    public static async Task SeedTestUsersAsync(AppDbContext db)
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
    /// 角色表为后期新增：旧库由 EnsureCreated 建库时不会补建，这里先兜底建表。
    /// 内置角色按 Key 逐项补种；后台暂不支持删除角色，不会与用户数据冲突。
    /// </summary>
    public static async Task SeedRolesAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "AppRoles" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_AppRoles" PRIMARY KEY,
                "Key" TEXT NOT NULL,
                "Label" TEXT NOT NULL,
                "Rank" INTEGER NOT NULL,
                "IsBuiltIn" INTEGER NOT NULL,
                "CreatedAt" TEXT NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_AppRoles_Key" ON "AppRoles" ("Key");
            """);

        AppRole[] defaults =
        [
            new() { Key = Roles.SuperAdmin, Label = "超级管理员", Rank = 4, IsBuiltIn = true },
            new() { Key = Roles.Admin, Label = "管理员", Rank = 3, IsBuiltIn = true },
            new() { Key = Roles.Manager, Label = "管理", Rank = 2, IsBuiltIn = true },
            new() { Key = Roles.User, Label = "普通用户", Rank = 1, IsBuiltIn = true },
            new() { Key = Roles.Guest, Label = "游客", Rank = 0, IsBuiltIn = true },
        ];

        foreach (var role in defaults)
        {
            if (await db.Roles.AnyAsync(r => r.Key == role.Key)) continue;
            db.Roles.Add(role);
        }
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 菜单表为后期新增：旧库由 EnsureCreated 建库时不会补建，这里先兜底建表/补列。
    /// 默认菜单按 Key 逐项补种；二级菜单上线后对内置项回填 Parent 与排序，
    /// 不覆盖用户已修改的名称、路径与可见角色。
    /// </summary>
    public static async Task SeedMenusAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "MenuItems" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_MenuItems" PRIMARY KEY,
                "Key" TEXT NOT NULL,
                "Path" TEXT NOT NULL,
                "Label" TEXT NOT NULL,
                "Order" INTEGER NOT NULL,
                "Roles" TEXT NOT NULL,
                "Parent" TEXT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_MenuItems_Key" ON "MenuItems" ("Key");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_MenuItems_Path" ON "MenuItems" ("Path");
            """);

        var conn = db.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = "SELECT COUNT(*) FROM pragma_table_info('MenuItems') WHERE name = 'Parent'";
            var hasColumn = Convert.ToInt64(await cmd.ExecuteScalarAsync()) > 0;
            if (!hasColumn)
                await db.Database.ExecuteSqlRawAsync("""ALTER TABLE "MenuItems" ADD COLUMN "Parent" TEXT;""");
        }

        MenuItem[] defaults =
        [
            new() { Key = "traitors", Path = "/traitors", Label = "名录管理", Order = 1, Roles = "admin,superadmin" },
            new() { Key = "reviews", Path = "/reviews", Label = "待审队列", Order = 2, Roles = "manager,admin,superadmin" },
            new() { Key = "system", Path = "/system", Label = "系统管理", Order = 3, Roles = "manager,admin,superadmin" },
            new() { Key = "users", Path = "/users", Label = "用户管理", Order = 1, Roles = "admin,superadmin", Parent = "system" },
            new() { Key = "roles", Path = "/roles", Label = "角色管理", Order = 2, Roles = "admin,superadmin", Parent = "system" },
            new() { Key = "menus", Path = "/menus", Label = "菜单管理", Order = 3, Roles = "admin,superadmin", Parent = "system" },
            new() { Key = "profile", Path = "/profile", Label = "个人信息", Order = 4, Roles = "manager,admin,superadmin", Parent = "system" },
        ];

        foreach (var item in defaults)
        {
            var existing = await db.MenuItems.FirstOrDefaultAsync(m => m.Key == item.Key);
            if (existing is null)
            {
                db.MenuItems.Add(item);
                continue;
            }
            if (existing.Parent != item.Parent || existing.Order != item.Order)
            {
                existing.Parent = item.Parent;
                existing.Order = item.Order;
            }
        }
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// 权限表与角色-权限关联表为后期新增：旧库由 EnsureCreated 建库时不会补建，这里先兜底建表。
    /// 权限按菜单逐项补种（Key 与菜单一致，名称同步）；关联数据首次从菜单可见角色列回填，
    /// 之后以本表为准，不再覆盖。
    /// </summary>
    public static async Task SeedPermissionsAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "Permissions" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_Permissions" PRIMARY KEY,
                "Key" TEXT NOT NULL,
                "Label" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Permissions_Key" ON "Permissions" ("Key");

            CREATE TABLE IF NOT EXISTS "RolePermissions" (
                "Id" TEXT NOT NULL CONSTRAINT "PK_RolePermissions" PRIMARY KEY,
                "RoleId" TEXT NOT NULL,
                "PermissionId" TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL,
                CONSTRAINT "FK_RolePermissions_AppRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AppRoles" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_RolePermissions_Permissions_PermissionId" FOREIGN KEY ("PermissionId") REFERENCES "Permissions" ("Id") ON DELETE CASCADE
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_RolePermissions_RoleId_PermissionId" ON "RolePermissions" ("RoleId", "PermissionId");
            CREATE INDEX IF NOT EXISTS "IX_RolePermissions_PermissionId" ON "RolePermissions" ("PermissionId");
            """);

        // 1) 权限与菜单同步：缺则补、名同改
        var menus = await db.MenuItems.ToListAsync();
        var permByKey = (await db.Permissions.ToListAsync()).ToDictionary(p => p.Key);
        foreach (var menu in menus)
        {
            if (permByKey.TryGetValue(menu.Key, out var existing))
            {
                if (existing.Label != menu.Label) existing.Label = menu.Label;
                continue;
            }
            var perm = new Permission { Key = menu.Key, Label = menu.Label };
            db.Permissions.Add(perm);
            permByKey[menu.Key] = perm;
        }
        await db.SaveChangesAsync();

        // 2) 首次初始化：按菜单可见角色列回填角色-权限关联
        if (!await db.RolePermissions.AnyAsync())
        {
            var roleIds = (await db.Roles.ToListAsync()).ToDictionary(r => r.Key, r => r.Id);
            foreach (var menu in menus)
            {
                if (!permByKey.TryGetValue(menu.Key, out var perm)) continue;
                foreach (var roleKey in menu.Roles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    if (!roleIds.TryGetValue(roleKey, out var roleId)) continue;
                    db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = perm.Id });
                }
            }
            await db.SaveChangesAsync();
        }
    }
}
