using System.ComponentModel.DataAnnotations;

namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 操作日志：POST/PUT/DELETE/PATCH 等写操作，包括 admin 后台和 web 用户端。
/// </summary>
public class OperationLog
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [MaxLength(64)] public string? UserId { get; set; }
    [MaxLength(64)] public string? Username { get; set; }
    [MaxLength(16)] public string? Role { get; set; }

    /// <summary>模块：traitors / users / roles / menus / revisions / uploads / me / auth …</summary>
    [MaxLength(64)] public string Module { get; set; } = "";
    /// <summary>动作：create / update / delete / review-approve / review-reject / upload / change-password …</summary>
    [MaxLength(64)] public string Action { get; set; } = "";

    /// <summary>操作对象的主键或标识（如 traitorId / revisionId / userId）</summary>
    [MaxLength(128)] public string? TargetId { get; set; }
    /// <summary>对象描述（如 汪精卫 新档案 / 用户张三 角色修改），便于日志列表直接理解</summary>
    [MaxLength(256)] public string? TargetLabel { get; set; }

    public int StatusCode { get; set; }
    [MaxLength(32)] public string? Status { get; set; } // success / fail
    [MaxLength(512)] public string? Message { get; set; }

    /// <summary>请求路径（不含 query）</summary>
    [MaxLength(512)] public string Path { get; set; } = "";
    [MaxLength(8)] public string Method { get; set; } = "";
    /// <summary>请求体或关键参数（JSON，截断；日志可开关是否存储完整 body）</summary>
    public string? RequestBody { get; set; }
    /// <summary>耗时毫秒</summary>
    public long ElapsedMs { get; set; }

    [MaxLength(64)] public string? Ip { get; set; }
    [MaxLength(512)] public string? UserAgent { get; set; }
    [MaxLength(16)] public string? ClientSource { get; set; }
}
