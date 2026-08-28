using HanJianNet.WebApi.Entities;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 管理员日志查询：4 类日志（登录/操作/查询/错误）统一分页返回。
/// 仅 admin 及以上角色可查。
/// </summary>
[ApiController]
[Route("api/admin/logs")]
[Authorize(Roles = "admin,superadmin")]
public class AdminLogsController(LogService logs) : ControllerBase
{
    private static DateTimeOffset? ParseDate(string? s, bool endOfDay = false)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        if (DateTimeOffset.TryParse(s, out var v))
            return endOfDay ? v.Date.AddDays(1).AddTicks(-1) : v.Date;
        return null;
    }

    /// <summary>分页查询登录日志</summary>
    [HttpGet("login-logs")]
    public async Task<IActionResult> LoginLogs(
        [FromQuery] string? keyword,
        [FromQuery] string? username,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var paged = await logs.ListLoginLogsAsync(new LogService.LogFilter(
            keyword, username, ParseDate(from), ParseDate(to, endOfDay: true), page, pageSize));
        return OkResult(paged);
    }

    /// <summary>分页查询操作日志</summary>
    [HttpGet("operation-logs")]
    public async Task<IActionResult> OperationLogs(
        [FromQuery] string? keyword,
        [FromQuery] string? username,
        [FromQuery] string? module,
        [FromQuery] string? action,
        [FromQuery] string? targetId,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var paged = await logs.ListOperationLogsAsync(
            new LogService.LogFilter(keyword, username, ParseDate(from), ParseDate(to, endOfDay: true), page, pageSize),
            module, action, targetId);
        return OkResult(paged);
    }

    /// <summary>分页查询查询日志</summary>
    [HttpGet("query-logs")]
    public async Task<IActionResult> QueryLogs(
        [FromQuery] string? keyword,
        [FromQuery] string? username,
        [FromQuery] string? module,
        [FromQuery] string? path,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var paged = await logs.ListQueryLogsAsync(
            new LogService.LogFilter(keyword, username, ParseDate(from), ParseDate(to, endOfDay: true), page, pageSize),
            module, path);
        return OkResult(paged);
    }

    /// <summary>分页查询错误日志</summary>
    [HttpGet("error-logs")]
    public async Task<IActionResult> ErrorLogs(
        [FromQuery] string? keyword,
        [FromQuery] string? username,
        [FromQuery] string? level,
        [FromQuery] string? path,
        [FromQuery] string? from,
        [FromQuery] string? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var paged = await logs.ListErrorLogsAsync(
            new LogService.LogFilter(keyword, username, ParseDate(from), ParseDate(to, endOfDay: true), page, pageSize),
            level, path);
        return OkResult(paged);
    }

    private OkObjectResult OkResult<T>(Common.PagedResult<T> paged) where T : class
        => Ok(new
        {
            items = paged.Items,
            total = paged.Total,
            page = paged.Page,
            pageSize = paged.PageSize,
            totalPages = paged.TotalPages,
        });
}
