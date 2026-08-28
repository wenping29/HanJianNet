namespace HanJianNet.WebApi.Middleware;

/// <summary>
/// 在认证之前启用 Request.Body 的重绕/缓冲，
/// 让下游 AuditActionFilter / ErrorHandlingMiddleware 可以安全重读 body 以写入日志。
/// </summary>
public class RequestBodyBufferingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        ctx.Request.EnableBuffering();
        try
        {
            await next(ctx);
        }
        finally
        {
            if (ctx.Request.Body.CanSeek) ctx.Request.Body.Position = 0;
        }
    }
}
