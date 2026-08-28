using System.Diagnostics;
using HanJianNet.WebApi.Controllers;

namespace HanJianNet.WebApi.Middleware;

/// <summary>
/// 从每个请求提取审计上下文（IP/UA/用户信息）并挂到 HttpContext.Items，
/// 同时启动耗时计时器，供下游 Filter/Middleware/Service 读取。
/// 放在 UseAuthentication 之后即可拿到登录用户。
/// </summary>
public class AuditEnrichmentMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        var timer = Stopwatch.StartNew();
        ctx.Items[AuditKeys.Timer] = timer;
        ctx.Items[AuditKeys.Context] = BuildAuditContext(ctx);
        try
        {
            await next(ctx);
        }
        finally
        {
            timer.Stop();
            ctx.Items[AuditKeys.ElapsedMs] = timer.ElapsedMilliseconds;
        }
    }

    private static AuditContext BuildAuditContext(HttpContext ctx)
    {
        var ip = (ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? ctx.Connection.RemoteIpAddress?.ToString())?.Trim();
        if (!string.IsNullOrEmpty(ip) && ip.Contains(','))
            ip = ip.Split(',', StringSplitOptions.RemoveEmptyEntries)[0].Trim();

        var ua = ctx.Request.Headers.UserAgent.ToString();
        var uaShort = ua.Length <= 512 ? ua : ua[..512];

        var referer = ctx.Request.Headers.Referer.ToString();
        var origin = ctx.Request.Headers.Origin.ToString();
        var clientSource = "api";
        if (!string.IsNullOrEmpty(referer))
        {
            if (referer.Contains(":5173") || referer.Contains("/admin") || origin.Contains(":5174") || origin.EndsWith("/admin", StringComparison.OrdinalIgnoreCase))
                clientSource = "admin";
            else if (referer.Contains(":5173") || origin.Contains(":5173"))
                clientSource = "web";
        }
        if (clientSource == "api")
        {
            if (ctx.Request.Path.StartsWithSegments("/api/admin")) clientSource = "admin";
            else if (ctx.Request.Path.StartsWithSegments("/api")) clientSource = "web";
        }

        var (userId, username, role) = CurrentUser.GetTriple(ctx.User);
        var path = ctx.Request.Path.ToString();
        string module;
        if (path.StartsWith("/api/admin/")) module = path.Split('/', 5, StringSplitOptions.RemoveEmptyEntries).ElementAtOrDefault(2) ?? "admin";
        else if (path.StartsWith("/api/")) module = path.Split('/', 4, StringSplitOptions.RemoveEmptyEntries).ElementAtOrDefault(1) ?? "unknown";
        else module = "static";

        string? ReadBodySafe()
        {
            if (!ctx.Request.HasFormContentType &&
                (ctx.Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) ?? false) == false &&
                string.IsNullOrEmpty(ctx.Request.ContentType) == false) return null;
            // 仅标记：不在这里读取 body；真正读取需要启用 RequestBodyBuffering
            return null;
        }

        return new AuditContext
        {
            Ip = ip,
            UserAgent = uaShort,
            ClientSource = clientSource,
            UserId = userId,
            Username = username,
            Role = role,
            Module = module,
            Method = ctx.Request.Method,
            Path = path,
            Query = ctx.Request.QueryString.Value,
            _bodyMarker = ReadBodySafe(),
        };
    }
}

/// <summary>AuditContext 在请求管道中的键名，避免到处 magic string。</summary>
public static class AuditKeys
{
    public const string Context = "Audit.Context";
    public const string Timer = "Audit.Timer";
    public const string ElapsedMs = "Audit.ElapsedMs";

    public static AuditContext GetAudit(this HttpContext ctx)
    {
        if (ctx.Items[Context] is AuditContext a) return a;
        // 中间件未启用：退化构造一份（防止测试/本地遗漏时报空）
        return new AuditContext
        {
            Ip = ctx.Connection.RemoteIpAddress?.ToString(),
            UserAgent = ctx.Request.Headers.UserAgent.ToString(),
            Method = ctx.Request.Method,
            Path = ctx.Request.Path.ToString(),
            Query = ctx.Request.QueryString.Value,
            Module = "unknown",
        };
    }

    public static long GetElapsedMs(this HttpContext ctx)
    {
        if (ctx.Items[ElapsedMs] is long l) return l;
        if (ctx.Items[Timer] is Stopwatch s) return s.ElapsedMilliseconds;
        return 0;
    }
}

/// <summary>请求级共享上下文，避免各组件重复解析。</summary>
public class AuditContext
{
    public string? Ip { get; set; }
    public string? UserAgent { get; set; }
    public string ClientSource { get; set; } = "api";

    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? Role { get; set; }

    public string Module { get; set; } = "";
    public string Method { get; set; } = "";
    public string Path { get; set; } = "";
    public string? Query { get; set; }

    internal string? _bodyMarker;
}
