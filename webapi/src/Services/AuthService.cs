using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Controllers;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Entities;
using HanJianNet.WebApi.Middleware;
using HanJianNet.WebApi.Options;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace HanJianNet.WebApi.Services;

public class AuthService(AppDbContext db, IOptions<JwtOptions> jwtOptions, LogService logService, IHttpContextAccessor httpCtx)
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        var username = req.Username.Trim();
        var email = req.Email.Trim().ToLowerInvariant();
        var ctx = httpCtx.HttpContext?.GetAudit();

        async Task FailAndLog(int status, string message)
        {
            await logService.WriteLoginAsync(new LoginWriteContext
            {
                Action = "register", Status = "fail", StatusCode = status, Message = message,
                Account = username, Username = username, Audit = ctx,
            });
        }

        if (username.Length < 2)
        {
            await FailAndLog(400, "用户名至少 2 个字符");
            throw new ApiException(400, "用户名至少 2 个字符");
        }
        if (!email.Contains('@'))
        {
            await FailAndLog(400, "邮箱格式不正确");
            throw new ApiException(400, "邮箱格式不正确");
        }
        if (req.Password.Length < 8)
        {
            await FailAndLog(400, "密码至少 8 位");
            throw new ApiException(400, "密码至少 8 位");
        }

        if (await db.Users.AnyAsync(u => u.Username == username))
        {
            await FailAndLog(409, "用户名已被占用");
            throw new ApiException(409, "用户名已被占用");
        }
        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            await FailAndLog(409, "邮箱已被注册");
            throw new ApiException(409, "邮箱已被注册");
        }

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = Roles.User,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        await logService.WriteLoginAsync(new LoginWriteContext
        {
            Action = "register", Status = "success", StatusCode = 200,
            UserId = user.Id, Username = user.Username, Account = username, Audit = ctx,
        });

        return new AuthResponse { Token = GenerateToken(user), User = user.ToDto() };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var account = req.Account.Trim();
        var ctx = httpCtx.HttpContext?.GetAudit();
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.Username == account || u.Email == account.ToLowerInvariant());

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            await logService.WriteLoginAsync(new LoginWriteContext
            {
                Action = "login", Status = "fail", StatusCode = 401, Message = "账号或密码错误",
                Account = account, Audit = ctx,
            });
            throw new ApiException(401, "账号或密码错误");
        }

        await logService.WriteLoginAsync(new LoginWriteContext
        {
            Action = "login", Status = "success", StatusCode = 200,
            UserId = user.Id, Username = user.Username, Account = account, Audit = ctx,
        });

        return new AuthResponse { Token = GenerateToken(user), User = user.ToDto() };
    }

    public async Task<UserDto> GetUserAsync(string id)
    {
        var user = await db.Users.FindAsync(id)
                   ?? throw new ApiException(404, "用户不存在");
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
