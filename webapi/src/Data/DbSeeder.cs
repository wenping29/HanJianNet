using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Data;

public static class DbSeeder
{
    public static async Task SeedAdminAsync(AppDbContext db, string username, string email, string password)
    {
        if (await db.Users.AnyAsync(u => u.Role == "admin")) return;
        db.Users.Add(new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = "admin",
        });
        await db.SaveChangesAsync();
    }
}
