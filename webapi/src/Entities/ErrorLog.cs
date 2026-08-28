using System.ComponentModel.DataAnnotations;

namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 错误日志：ApiException / 未捕获异常等。
/// </summary>
public class ErrorLog
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [MaxLength(64)] public string? UserId { get; set; }
    [MaxLength(64)] public string? Username { get; set; }
    [MaxLength(16)] public string? Role { get; set; }

    /// <summary>严重度：warning / error / critical（500 未捕获异常一律 critical；业务 ApiException 根据状态码：4xx=warning 5xx=error）</summary>
    [MaxLength(16)] public string Level { get; set; } = "";

    /// <summary>异常类型名：ApiException / NullReferenceException / DbUpdateException …</summary>
    [MaxLength(128)] public string ExceptionType { get; set; } = "";
    [MaxLength(1024)] public string Message { get; set; } = "";
    /// <summary>堆栈（截断 8KB）</summary>
    [MaxLength(8192)] public string? StackTrace { get; set; }

    /// <summary>HTTP 响应码</summary>
    public int StatusCode { get; set; }
    [MaxLength(512)] public string Path { get; set; } = "";
    [MaxLength(8)] public string Method { get; set; } = "";
    [MaxLength(2048)] public string? Query { get; set; }
    public string? RequestBody { get; set; }

    [MaxLength(64)] public string? Ip { get; set; }
    [MaxLength(512)] public string? UserAgent { get; set; }
    [MaxLength(16)] public string? ClientSource { get; set; }
}
