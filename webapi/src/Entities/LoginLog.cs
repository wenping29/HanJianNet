using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 登录日志：记录账号登录/注册/登出（无论成功失败）。
/// 字段可无 UserId：失败/游客注册。
/// </summary>
public class LoginLog
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>触发的动作：login / register / logout / refresh / change-password</summary>
    [MaxLength(32)] public string Action { get; set; } = "";

    /// <summary>关联的用户 Id（已登录/注册成功才有）</summary>
    [MaxLength(64)] public string? UserId { get; set; }
    [MaxLength(64)] public string? Username { get; set; }

    /// <summary>输入的登录账号（邮箱或用户名），失败时也记录便于安全审计</summary>
    [MaxLength(128)] public string? Account { get; set; }

    /// <summary>success / fail</summary>
    [MaxLength(16)] public string Status { get; set; } = "";
    /// <summary>HTTP 响应码或业务状态码</summary>
    public int StatusCode { get; set; }
    /// <summary>失败时的消息（密码错/账号不存在等），截断 512 字</summary>
    [MaxLength(512)] public string? Message { get; set; }

    /// <summary>客户端 IP</summary>
    [MaxLength(64)] public string? Ip { get; set; }
    /// <summary>User-Agent（截断）</summary>
    [MaxLength(512)] public string? UserAgent { get; set; }
    /// <summary>请求来源：web / admin / api</summary>
    [MaxLength(16)] public string? ClientSource { get; set; }
}
