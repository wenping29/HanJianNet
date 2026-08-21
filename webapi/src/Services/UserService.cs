using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

public class UserService(AppDbContext db)
{
    // ---------- 用户管理（管理员） ----------

    public async Task<List<UserDto>> ListAsync()
    {
        var users = await db.Users
            .OrderByDescending(u => Roles.Rank(u.Role))
            .ThenBy(u => u.CreatedAt)
            .ToListAsync();
        return users.Select(u => u.ToDto()).ToList();
    }

    public async Task<UserDto> CreateAsync(string actorId, CreateUserRequest req)
    {
        var username = req.Username.Trim();
        var email = req.Email.Trim().ToLowerInvariant();

        ValidateAccount(username, email, req.Password);
        if (!Roles.IsValid(req.Role)) throw new ApiException(400, $"未知角色：{req.Role}");

        var actor = await db.Users.FindAsync(actorId)
                    ?? throw new ApiException(401, "无法识别当前用户");
        if (Roles.Rank(req.Role) >= Roles.Rank(actor.Role))
            throw new ApiException(403, "无权创建该角色的账号");

        if (await db.Users.AnyAsync(u => u.Username == username))
            throw new ApiException(409, "用户名已被占用");
        if (await db.Users.AnyAsync(u => u.Email == email))
            throw new ApiException(409, "邮箱已被注册");

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = req.Role,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user.ToDto();
    }

    public async Task<UserDto> UpdateAsync(string actorId, string targetId, UpdateUserRequest req)
    {
        var actor = await db.Users.FindAsync(actorId)
                    ?? throw new ApiException(401, "无法识别当前用户");
        var target = await db.Users.FindAsync(targetId)
                     ?? throw new ApiException(404, "用户不存在");
        EnsureCanManage(actor, target);

        var username = req.Username.Trim();
        var email = req.Email.Trim().ToLowerInvariant();
        ValidateAccount(username, email, password: null);

        if (await db.Users.AnyAsync(u => u.Username == username && u.Id != target.Id))
            throw new ApiException(409, "用户名已被占用");
        if (await db.Users.AnyAsync(u => u.Email == email && u.Id != target.Id))
            throw new ApiException(409, "邮箱已被注册");

        target.Username = username;
        target.Email = email;
        if (!string.IsNullOrEmpty(req.Password))
        {
            if (req.Password.Length < 8) throw new ApiException(400, "密码至少 8 位");
            target.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        }
        await db.SaveChangesAsync();
        return target.ToDto();
    }

    public async Task<UserDto> ChangeRoleAsync(string actorId, string targetId, string role)
    {
        if (!Roles.IsValid(role)) throw new ApiException(400, $"未知角色：{role}");

        var actor = await db.Users.FindAsync(actorId)
                    ?? throw new ApiException(401, "无法识别当前用户");
        var target = await db.Users.FindAsync(targetId)
                     ?? throw new ApiException(404, "用户不存在");

        if (actor.Id == target.Id) throw new ApiException(400, "不能修改自己的角色");

        int actorRank = Roles.Rank(actor.Role);
        int targetRank = Roles.Rank(target.Role);
        int newRank = Roles.Rank(role);

        // 只能操作层级低于自己的账号，且不能授予不低于自己的角色。
        if (actorRank <= targetRank) throw new ApiException(403, "无权修改该用户的角色");
        if (newRank >= actorRank) throw new ApiException(403, "无权授予该角色");

        target.Role = role;
        await db.SaveChangesAsync();
        return target.ToDto();
    }

    public async Task DeleteAsync(string actorId, string targetId)
    {
        var actor = await db.Users.FindAsync(actorId)
                    ?? throw new ApiException(401, "无法识别当前用户");
        var target = await db.Users.FindAsync(targetId)
                     ?? throw new ApiException(404, "用户不存在");
        EnsureCanManage(actor, target);

        bool hasRevisions = await db.Revisions.AnyAsync(
            r => r.SubmitterId == target.Id || r.ReviewerId == target.Id);
        if (hasRevisions) throw new ApiException(409, "该用户存在提交或审核记录，无法删除");

        db.Users.Remove(target);
        await db.SaveChangesAsync();
    }

    // ---------- 个人信息（本人） ----------

    public async Task<UserDto> UpdateProfileAsync(string selfId, UpdateProfileRequest req)
    {
        var user = await db.Users.FindAsync(selfId)
                   ?? throw new ApiException(401, "无法识别当前用户");

        var username = req.Username.Trim();
        var email = req.Email.Trim().ToLowerInvariant();
        ValidateAccount(username, email, password: null);

        if (await db.Users.AnyAsync(u => u.Username == username && u.Id != user.Id))
            throw new ApiException(409, "用户名已被占用");
        if (await db.Users.AnyAsync(u => u.Email == email && u.Id != user.Id))
            throw new ApiException(409, "邮箱已被注册");

        user.Username = username;
        user.Email = email;
        await db.SaveChangesAsync();
        return user.ToDto();
    }

    public async Task ChangePasswordAsync(string selfId, ChangePasswordRequest req)
    {
        var user = await db.Users.FindAsync(selfId)
                   ?? throw new ApiException(401, "无法识别当前用户");

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            throw new ApiException(400, "当前密码不正确");
        if (req.NewPassword.Length < 8) throw new ApiException(400, "新密码至少 8 位");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await db.SaveChangesAsync();
    }

    // ---------- 内部 ----------

    private static void ValidateAccount(string username, string email, string? password)
    {
        if (username.Length < 2) throw new ApiException(400, "用户名至少 2 个字符");
        if (!email.Contains('@')) throw new ApiException(400, "邮箱格式不正确");
        if (password is not null && password.Length < 8) throw new ApiException(400, "密码至少 8 位");
    }

    private static void EnsureCanManage(User actor, User target)
    {
        if (actor.Id == target.Id) throw new ApiException(400, "不能对自己执行该操作");
        if (Roles.Rank(actor.Role) <= Roles.Rank(target.Role))
            throw new ApiException(403, "无权操作该用户");
    }
}
