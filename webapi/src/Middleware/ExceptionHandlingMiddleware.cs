using System.Text.Json;
using HanJianNet.WebApi.Common;

namespace HanJianNet.WebApi.Middleware;

/// <summary>
/// 统一异常处理：将 ApiException 与未捕获异常转换为 { message } JSON 响应。
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (ApiException ex)
        {
            await WriteAsync(ctx, ex.Status, ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteAsync(ctx, 401, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "未处理的异常");
            await WriteAsync(ctx, 500, "服务器内部错误");
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
