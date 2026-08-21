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
    /// 菜单表为后期新增：旧库由 EnsureCreated 建库时不会补建，这里先兜底建表。
    /// 默认菜单按 Key 逐项补种，保证升级后能拿到新增入口；后台暂不支持删除，不会与用户数据冲突。
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
                "Roles" TEXT NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_MenuItems_Key" ON "MenuItems" ("Key");
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_MenuItems_Path" ON "MenuItems" ("Path");
            """);

        MenuItem[] defaults =
        [
            new() { Key = "traitors", Path = "/traitors", Label = "名录管理", Order = 1, Roles = "admin,superadmin" },
            new() { Key = "reviews", Path = "/reviews", Label = "待审队列", Order = 2, Roles = "manager,admin,superadmin" },
            new() { Key = "users", Path = "/users", Label = "用户管理", Order = 3, Roles = "admin,superadmin" },
            new() { Key = "roles", Path = "/roles", Label = "角色管理", Order = 4, Roles = "admin,superadmin" },
            new() { Key = "menus", Path = "/menus", Label = "菜单管理", Order = 5, Roles = "admin,superadmin" },
            new() { Key = "profile", Path = "/profile", Label = "个人信息", Order = 6, Roles = "manager,admin,superadmin" },
        ];

        foreach (var item in defaults)
        {
            if (await db.MenuItems.AnyAsync(m => m.Key == item.Key)) continue;
            db.MenuItems.Add(item);
        }
        await db.SaveChangesAsync();
    }
}
