using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Middleware;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;

namespace HanJianNet.WebApi.Filters;

/// <summary>
/// 全局审计过滤器：
///   - GET /api/... = 查询日志（QueryLog）；
///   - POST/PUT/PATCH/DELETE /api/... = 操作日志（OperationLog）；
/// 排除：swagger、uploads 静态、/api/admin/logs 查询（避免日志查日志）、登录相关由 AuthService 精确写入。
/// 对未处理异常的接口：由 ExceptionHandlingMiddleware 写 ErrorLog，此处过滤器只在「成功走完 ActionResult」时写。
/// </summary>
public class AuditActionFilter(LogService logService) : IAsyncActionFilter
{
    private static readonly HashSet<string> SkipPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "/swagger",
        "/api/admin/logs",
        "/uploads",
        "/data/",  // 前端地图静态数据
    };
    private static readonly HashSet<string> LoginPathEndings = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/me",
    };

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var path = context.HttpContext.Request.Path.ToString() ?? "";
        var method = context.HttpContext.Request.Method ?? "";
        var skipByPrefix = SkipPrefixes.Any(p => path.StartsWith(p, StringComparison.OrdinalIgnoreCase));
        var isLogin = LoginPathEndings.Contains(path);

        // 只拦截 Controller 的 API 请求
        if (skipByPrefix ||
            context.ActionDescriptor is not ControllerActionDescriptor ||
            path.StartsWith("/api") == false)
        {
            var post = await next();
            return;
        }

        string? reqBody = null;
        if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsDelete(method))
        {
            // 仅当 enableBuffering 时可安全重读；Program 中已在 Auth 前启用缓冲
            var req = context.HttpContext.Request;
            if (req.ContentLength is > 0 and <= 4096 &&
                (req.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) ?? false))
            {
                try
                {
                    req.Body.Position = 0;
                    using var sr = new StreamReader(req.Body, leaveOpen: true);
                    var raw = await sr.ReadToEndAsync();
                    req.Body.Position = 0;
                    reqBody = TrimTo(raw, 4096);
                }
                catch { /* 忽略 body 读取失败，不影响接口功能 */ }
            }
        }

        var executed = await next();

        var ctx = context.HttpContext;
        var audit = ctx.GetAudit();
        var elapsed = ctx.GetElapsedMs();
        var status = ctx.Response.StatusCode;

        if (executed.Exception is not null && !executed.ExceptionHandled)
        {
            // 异常处理交给 ExceptionHandlingMiddleware
            return;
        }

        // 登录接口由 AuthService 精确写 LoginLog（能拿到 success/fail + 账号），
        // 此处仅作为写操作/读操作的补充：仍写一条操作日志，便于审计链路（但 module 标记为 auth）
        int? hitCount = null;
        if (HttpMethods.IsGet(method))
        {
            // 读操作 => QueryLog
            if (executed.Result is ObjectResult obj && obj.Value != null)
            {
                // 尝试推导 "items.count"：如 { items: [...] } / PagedResult<...>
                try
                {
                    if (obj.Value is System.Collections.IEnumerable en)
                    {
                        hitCount = 0;
                        var prop = obj.Value.GetType().GetProperty("Items");
                        if (prop != null && prop.GetValue(obj.Value) is System.Collections.IEnumerable items)
                        {
                            var c = 0;
                            foreach (var _ in items) c++;
                            hitCount = c;
                        }
                        else
                        {
                            var c = 0;
                            foreach (var _ in en) c++;
                            hitCount = c;
                        }
                    }
                    else
                    {
                        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(obj.Value, JsonOpts.Default));
                        if (doc.RootElement.TryGetProperty("total", out var totalEl) && totalEl.TryGetInt32(out var t))
                            hitCount = t;
                        else if (doc.RootElement.TryGetProperty("items", out var itemsEl) && itemsEl.ValueKind == JsonValueKind.Array)
                            hitCount = itemsEl.GetArrayLength();
                    }
                }
                catch { /* 忽略 */ }
            }

            await logService.WriteQueryAsync(new QueryWriteContext
            {
                Audit = audit, StatusCode = status, ElapsedMs = elapsed, HitCount = hitCount,
            });
        }
        else
        {
            var targetId = ExtractTargetId(context.RouteData.Values);
            var (ok, statusStr, message) = DescribeResult(status, executed);
            var (actionName, moduleOverride) = InferAction(context);
            await logService.WriteOperationAsync(new OperationWriteContext
            {
                Audit = audit,
                StatusCode = status,
                Status = ok ? "success" : "fail",
                Message = message,
                ElapsedMs = elapsed,
                Module = moduleOverride ?? audit.Module,
                Action = actionName,
                TargetId = targetId,
                RequestBody = reqBody,
            });
        }
    }

    private static (string action, string? moduleOverride) InferAction(ActionExecutingContext context)
    {
        if (context.ActionDescriptor is not ControllerActionDescriptor cd) return ("", null);
        var method = context.HttpContext.Request.Method;
        var action = cd.ActionName.ToLowerInvariant();
        if (action == "review") return ("review", "revisions");
        if (action.EndsWith("review")) return (action, "revisions");
        if (action == "login" || action == "logout" || action == "register") return (action, "auth");
        if (action == "create" || action == "post") return ("create", null);
        if (action == "update" || action == "put") return ("update", null);
        if (action == "delete" || action == "remove") return ("delete", null);
        if (method == "POST") return ("create", null);
        if (method == "PUT" || method == "PATCH") return ("update", null);
        if (method == "DELETE") return ("delete", null);
        return (action, null);
    }

    private static string? ExtractTargetId(RouteValueDictionary route)
    {
        if (route.TryGetValue("id", out var idObj) && idObj != null) return idObj.ToString();
        if (route.TryGetValue("rid", out var ridObj) && ridObj != null) return ridObj.ToString();
        return null;
    }

    private static (bool ok, string status, string? message) DescribeResult(int statusCode, ActionExecutedContext ctx)
    {
        var ok = statusCode is >= 200 and < 400;
        var message = (string?)null;
        if (ctx.Result is ObjectResult o && o.Value != null)
        {
            var type = o.Value.GetType();
            var prop = type.GetProperty("Message") ?? type.GetProperty("message");
            var v = prop?.GetValue(o.Value)?.ToString();
            if (!string.IsNullOrEmpty(v)) message = TrimTo(v, 512);
        }
        return (ok, ok ? "success" : "fail", message);
    }

    private static string? TrimTo(string s, int max)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return s.Length <= max ? s : s[..max];
    }
}
