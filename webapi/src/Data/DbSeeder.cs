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
}
