using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using HanJianNet.WebApi.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HanJianNet.WebApi.Services;

public class AuthService(AppDbContext db, IOptions<JwtOptions> jwtOptions)
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var username = req.Username.Trim();
        var email = req.Email.Trim().ToLowerInvariant();

        if (username.Length < 2) throw new ApiException(400, "用户名至少 2 个字符");
        if (!email.Contains('@')) throw new ApiException(400, "邮箱格式不正确");
        if (req.Password.Length < 8) throw new ApiException(400, "密码至少 8 位");

        if (await db.Users.AnyAsync(u => u.Username == username))
            throw new ApiException(409, "用户名已被占用");
        if (await db.Users.AnyAsync(u => u.Email == email))
            throw new ApiException(409, "邮箱已被注册");

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "user",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return new AuthResponse { Token = GenerateToken(user), User = user.ToDto() };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var account = req.Account.Trim();
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.Username == account || u.Email == account.ToLowerInvariant());

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new ApiException(401, "账号或密码错误");

        return new AuthResponse { Token = GenerateToken(user), User = user.ToDto() };
    }

    public async Task<UserDto> GetUserAsync(string id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) throw new ApiException(404, "用户不存在");
        return user.ToDto();
    }

    private string GenerateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new("username", user.Username),
            new("role", user.Role),
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.ExpireMinutes),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
