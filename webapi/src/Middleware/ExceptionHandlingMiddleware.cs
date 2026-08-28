using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Middleware;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Http.Features;

namespace HanJianNet.WebApi.Middleware;

/// <summary>
/// 统一异常处理：将 ApiException 与未捕获异常转换为 { message } JSON 响应，
/// 同时写入 ErrorLog（数据库留存，便于管理员排查）。
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx, LogService logService)
    {
        try
        {
            await next(ctx);
        }
        catch (ApiException ex)
        {
            var level = ex.Status >= 500 ? "error" : "warning";
            await LogError(logService, ex, ctx, ex.Status, level);
            await WriteAsync(ctx, ex.Status, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await LogError(logService, ex, ctx, 401, "warning");
            await WriteAsync(ctx, 401, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "未处理的异常");
            await LogError(logService, ex, ctx, 500, "critical");
            await WriteAsync(ctx, 500, "服务器内部错误");
        }
    }

    private async Task LogError(LogService logService, Exception ex, HttpContext ctx, int status, string level)
    {
        try
        {
            var audit = ctx.GetAudit();
            string? body = null;
            if (ctx.Request.Body.CanSeek)
            {
                try
                {
                    ctx.Request.Body.Position = 0;
                    using var sr = new StreamReader(ctx.Request.Body, leaveOpen: true);
                    var raw = await sr.ReadToEndAsync();
                    ctx.Request.Body.Position = 0;
                    if (raw.Length > 0 && raw.Length <= 4096) body = raw;
                    else if (raw.Length > 4096) body = raw[..4096];
                }
                catch { /* 忽略 */ }
            }

            await logService.WriteErrorAsync(new ErrorWriteContext
            {
                Audit = audit,
                StatusCode = status,
                Level = level,
                ExceptionType = ex.GetType().Name,
                Message = ex.Message,
                StackTrace = ex.StackTrace,
                RequestBody = body,
            });
        }
        catch (Exception logEx)
        {
            // 错误日志写入失败只在控制台告警，不要掩盖原始异常
            Console.WriteLine($"[LOG FAIL] ErrorHandlingMiddleware write: {logEx.Message}");
        }
    }

    private static Task WriteAsync(HttpContext ctx, int status, string message)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        var payload = JsonSerializer.Serialize(new { message }, JsonOpts.Default);
        return ctx.Response.WriteAsync(payload);
    }
}
