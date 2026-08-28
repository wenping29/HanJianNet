using System.ComponentModel.DataAnnotations;

namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 查询日志：GET 等读操作（档案检索、分省统计、用户查询、列表分页）。
/// 不含静态文件、健康检查、swagger 等。
/// </summary>
public class QueryLog
{
    [Key] public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [MaxLength(64)] public string? UserId { get; set; }
    [MaxLength(64)] public string? Username { get; set; }
    [MaxLength(16)] public string? Role { get; set; }

    /// <summary>模块：traitors / stats / province-stats / users / roles / menus / me …</summary>
    [MaxLength(64)] public string Module { get; set; } = "";

    [MaxLength(512)] public string Path { get; set; } = "";
    [MaxLength(8)] public string Method { get; set; } = "";
    /// <summary>查询字符串（截断 2KB）</summary>
    [MaxLength(2048)] public string? Query { get; set; }

    /// <summary>命中数量（列表/查询类接口），未返回则为 null</summary>
    public int? HitCount { get; set; }

    public int StatusCode { get; set; }
    public long ElapsedMs { get; set; }

    [MaxLength(64)] public string? Ip { get; set; }
    [MaxLength(512)] public string? UserAgent { get; set; }
    [MaxLength(16)] public string? ClientSource { get; set; }
}
