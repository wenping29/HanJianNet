using System.Globalization;
using System.Text.RegularExpressions;
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
        var users = await db.Users.ToListAsync();
        return users
            .OrderByDescending(u => Roles.Rank(u.Role))
            .ThenBy(u => u.CreatedAt)
            .Select(u => u.ToDto())
            .ToList();
    }

    public async Task<UserDto> CreateAsync(string actorId, CreateUserRequest req)
    {
        var username = req.Username.Trim();
        var email = req.Email.Trim().ToLowerInvariant();

        ValidateAccount(username, email, req.Password);
        if (!await db.Roles.AnyAsync(r => r.Key == req.Role)) throw new ApiException(400, $"未知角色：{req.Role}");

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
        if (!await db.Roles.AnyAsync(r => r.Key == role)) throw new ApiException(400, $"未知角色：{role}");

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

        // 用户名/邮箱：仅当显式提交时才校验并更新（移动端编辑资料页已不允许修改这两项）
        var username = req.Username?.Trim();
        var email = req.Email?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(username) || !string.IsNullOrEmpty(email))
        {
            username = string.IsNullOrEmpty(username) ? user.Username : username;
            email = string.IsNullOrEmpty(email) ? user.Email : email;
            ValidateAccount(username, email, password: null);

            if (await db.Users.AnyAsync(u => u.Username == username && u.Id != user.Id))
                throw new ApiException(409, "用户名已被占用");
            if (await db.Users.AnyAsync(u => u.Email == email && u.Id != user.Id))
                throw new ApiException(409, "邮箱已被注册");

            user.Username = username;
            user.Email = email;
        }

        // 以下扩展资料字段：null 表示不修改，空串表示清除
        if (req.Gender is not null)
        {
            var gender = req.Gender.Trim();
            if (gender is not ("" or "male" or "female" or "secret"))
                throw new ApiException(400, "性别取值无效");
            user.Gender = gender == "" ? null : gender;
        }
        if (req.Birthday is not null)
        {
            var birthday = req.Birthday.Trim();
            if (birthday.Length > 0 && !DateTime.TryParseExact(
                    birthday, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                throw new ApiException(400, "生日格式应为 yyyy-MM-dd");
            user.Birthday = birthday == "" ? null : birthday;
        }
        if (req.Phone is not null)
        {
            var phone = req.Phone.Trim();
            if (phone.Length > 0 && !Regex.IsMatch(phone, @"^[0-9+\-\s]{5,20}$"))
                throw new ApiException(400, "手机号格式不正确");
            user.Phone = phone == "" ? null : phone;
        }
        if (req.Address is not null)
        {
            var address = req.Address.Trim();
            if (address.Length > 200) throw new ApiException(400, "地址不能超过 200 字");
            user.Address = address == "" ? null : address;
        }
        if (req.Nickname is not null)
        {
            var nickname = req.Nickname.Trim();
            if (nickname.Length > 32) throw new ApiException(400, "昵称不能超过 32 字");
            user.Nickname = nickname == "" ? null : nickname;
        }
        if (req.Signature is not null)
        {
            var signature = req.Signature.Trim();
            if (signature.Length > 200) throw new ApiException(400, "签名不能超过 200 字");
            user.Signature = signature == "" ? null : signature;
        }
        if (req.Region is not null)
        {
            var region = req.Region.Trim();
            if (region.Length > 64) throw new ApiException(400, "地区不能超过 64 字");
            user.Region = region == "" ? null : region;
        }

        await db.SaveChangesAsync();
        return user.ToDto();
    }

    /// <summary>更新本人头像。仅允许指向本站 /uploads/ 下的文件（先经上传接口落盘）。</summary>
    public async Task<UserDto> UpdateAvatarAsync(string selfId, UpdateAvatarRequest req)
    {
        var user = await db.Users.FindAsync(selfId)
                   ?? throw new ApiException(401, "无法识别当前用户");

        var url = req.AvatarUrl.Trim();
        if (!url.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            throw new ApiException(400, "头像地址无效，请先上传图片");

        user.AvatarUrl = url;
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

    // ---------- 站内通知（本人） ----------

    /// <summary>我的通知列表（最新 100 条）及未读数。</summary>
    public async Task<(List<NotificationDto> Items, int UnreadCount)> MyNotificationsAsync(string selfId)
    {
        var items = await db.Notifications
            .Where(n => n.UserId == selfId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(100)
            .ToListAsync();
        return (items.Select(n => n.ToDto()).ToList(), items.Count(n => !n.IsRead));
    }

    public async Task MarkNotificationReadAsync(string selfId, string id)
    {
        var n = await db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == selfId)
                ?? throw new ApiException(404, "通知不存在");
        if (n.IsRead) return;
        n.IsRead = true;
        await db.SaveChangesAsync();
    }

    public async Task MarkAllNotificationsReadAsync(string selfId)
    {
        await db.Notifications
            .Where(n => n.UserId == selfId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }

    public async Task<List<RevisionDto>> MySubmissionsAsync(string selfId)
    {
        var items = await db.Revisions
            .Where(r => r.SubmitterId == selfId)
            .OrderByDescending(r => r.SubmittedAt)
            .Include(r => r.Submitter)
            .Include(r => r.Reviewer)
            .ToListAsync();
        return items.Select(r => r.ToDto()).ToList();
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
