using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Entities;
using HanJianNet.WebApi.Middleware;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Services;

/// <summary>写入上下文：登录成功/失败、注册、登出等场景。</summary>
public class LoginWriteContext
{
    public string Action { get; set; } = "";
    public string Status { get; set; } = "success";
    public int StatusCode { get; set; } = 200;
    public string? Message { get; set; }
    public string? UserId { get; set; }
    public string? Username { get; set; }
    public string? Account { get; set; }
    public AuditContext? Audit { get; set; }
}

public class OperationWriteContext
{
    public AuditContext Audit { get; set; } = default!;
    public int StatusCode { get; set; }
    public string Status { get; set; } = "success";
    public string? Message { get; set; }
    public long ElapsedMs { get; set; }
    public string Module { get; set; } = "";
    public string Action { get; set; } = "";
    public string? TargetId { get; set; }
    public string? TargetLabel { get; set; }
    public string? RequestBody { get; set; }
}

public class QueryWriteContext
{
    public AuditContext Audit { get; set; } = default!;
    public int StatusCode { get; set; }
    public long ElapsedMs { get; set; }
    public int? HitCount { get; set; }
}

public class ErrorWriteContext
{
    public AuditContext Audit { get; set; } = default!;
    public int StatusCode { get; set; }
    public string Level { get; set; } = "";
    public string ExceptionType { get; set; } = "";
    public string Message { get; set; } = "";
    public string? StackTrace { get; set; }
    public string? RequestBody { get; set; }
}

/// <summary>
/// 4 类日志写入 + 管理员分页查询。
/// 写入操作都以 try/catch 包裹：日志失败不得影响接口本身的响应。
/// </summary>
public class LogService(AppDbContext db)
{
    // ---------- 写入：全部 try/catch，失败不抛 ----------
    private static string? Truncate(string? s, int max)
        => string.IsNullOrEmpty(s) || s.Length <= max ? s : s[..max];
    private static string? TruncateStackTrace(string? s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        // 对栈做长度保护；同时避免密码等出现在栈里（默认框架栈不含敏感参数）
        return s.Length <= 8192 ? s : s[..8192];
    }

    public async Task WriteLoginAsync(LoginWriteContext ctx)
    {
        try
        {
            var a = ctx.Audit!;
            db.LoginLogs.Add(new LoginLog
            {
                Action = Truncate(ctx.Action, 32) ?? "login",
                Status = Truncate(ctx.Status, 16) ?? "fail",
                StatusCode = ctx.StatusCode,
                Message = Truncate(ctx.Message, 512),
                UserId = Truncate(ctx.UserId, 64),
                Username = Truncate(ctx.Username, 64),
                Account = Truncate(ctx.Account, 128),
                Ip = Truncate(a.Ip, 64),
                UserAgent = Truncate(a.UserAgent, 512),
                ClientSource = Truncate(a.ClientSource, 16),
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // 写日志失败不应影响接口
            Console.WriteLine($"[LOG FAIL] WriteLoginAsync: {ex.Message}");
        }
    }

    public async Task WriteOperationAsync(OperationWriteContext ctx)
    {
        try
        {
            var a = ctx.Audit;
            db.OperationLogs.Add(new OperationLog
            {
                UserId = Truncate(a.UserId, 64),
                Username = Truncate(a.Username, 64),
                Role = Truncate(a.Role, 16),
                Module = Truncate(ctx.Module, 64) ?? a.Module,
                Action = Truncate(ctx.Action, 64) ?? a.Method,
                TargetId = Truncate(ctx.TargetId, 128),
                TargetLabel = Truncate(ctx.TargetLabel, 256),
                StatusCode = ctx.StatusCode,
                Status = Truncate(ctx.Status, 16) ?? (ctx.StatusCode is >= 200 and < 400 ? "success" : "fail"),
                Message = Truncate(ctx.Message, 512),
                Path = Truncate(a.Path, 512) ?? "",
                Method = Truncate(a.Method, 8) ?? "",
                RequestBody = Truncate(ctx.RequestBody, 4096),
                ElapsedMs = ctx.ElapsedMs,
                Ip = Truncate(a.Ip, 64),
                UserAgent = Truncate(a.UserAgent, 512),
                ClientSource = Truncate(a.ClientSource, 16),
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LOG FAIL] WriteOperationAsync: {ex.Message}");
        }
    }

    public async Task WriteQueryAsync(QueryWriteContext ctx)
    {
        try
        {
            var a = ctx.Audit;
            db.QueryLogs.Add(new QueryLog
            {
                UserId = Truncate(a.UserId, 64),
                Username = Truncate(a.Username, 64),
                Role = Truncate(a.Role, 16),
                Module = Truncate(a.Module, 64) ?? "",
                Path = Truncate(a.Path, 512) ?? "",
                Method = Truncate(a.Method, 8) ?? "",
                Query = Truncate(a.Query, 2048),
                HitCount = ctx.HitCount,
                StatusCode = ctx.StatusCode,
                ElapsedMs = ctx.ElapsedMs,
                Ip = Truncate(a.Ip, 64),
                UserAgent = Truncate(a.UserAgent, 512),
                ClientSource = Truncate(a.ClientSource, 16),
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LOG FAIL] WriteQueryAsync: {ex.Message}");
        }
    }

    public async Task WriteErrorAsync(ErrorWriteContext ctx)
    {
        try
        {
            var a = ctx.Audit;
            db.ErrorLogs.Add(new ErrorLog
            {
                UserId = Truncate(a.UserId, 64),
                Username = Truncate(a.Username, 64),
                Role = Truncate(a.Role, 16),
                Level = Truncate(ctx.Level, 16) ?? "error",
                ExceptionType = Truncate(ctx.ExceptionType, 128) ?? "Unknown",
                Message = Truncate(ctx.Message, 1024) ?? "",
                StackTrace = TruncateStackTrace(ctx.StackTrace),
                StatusCode = ctx.StatusCode,
                Path = Truncate(a.Path, 512) ?? "",
                Method = Truncate(a.Method, 8) ?? "",
                Query = Truncate(a.Query, 2048),
                RequestBody = Truncate(ctx.RequestBody, 4096),
                Ip = Truncate(a.Ip, 64),
                UserAgent = Truncate(a.UserAgent, 512),
                ClientSource = Truncate(a.ClientSource, 16),
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[LOG FAIL] WriteErrorAsync: {ex.Message}");
        }
    }

    // ---------- 管理员分页查询（通用）----------

    public record LogFilter(string? Keyword, string? Username, DateTimeOffset? From, DateTimeOffset? To, int Page, int PageSize);

    public async Task<PagedResult<LoginLog>> ListLoginLogsAsync(LogFilter f)
    {
        var (page, ps) = Normalize(f);
        var q = db.LoginLogs.AsNoTracking().AsQueryable();
        q = ApplyTime(q, f.From, f.To);
        if (!string.IsNullOrWhiteSpace(f.Username))
        {
            var s = f.Username.Trim();
            q = q.Where(l => (l.Username != null && l.Username.Contains(s)) ||
                             (l.Account != null && l.Account.Contains(s)));
        }
        if (!string.IsNullOrWhiteSpace(f.Keyword))
        {
            var k = f.Keyword.Trim();
            q = q.Where(l =>
                (l.Ip != null && l.Ip.Contains(k)) ||
                (l.Action != null && l.Action.Contains(k)) ||
                (l.Status != null && l.Status.Contains(k)) ||
                (l.Message != null && l.Message.Contains(k)));
        }
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(l => l.CreatedAt).Skip((page - 1) * ps).Take(ps).ToListAsync();
        return new PagedResult<LoginLog>(items, total, page, ps);
    }

    public async Task<PagedResult<OperationLog>> ListOperationLogsAsync(LogFilter f, string? module, string? action, string? targetId)
    {
        var (page, ps) = Normalize(f);
        var q = db.OperationLogs.AsNoTracking().AsQueryable();
        q = ApplyTime(q, f.From, f.To);
        if (!string.IsNullOrWhiteSpace(f.Username))
        {
            var s = f.Username.Trim();
            q = q.Where(o => o.Username != null && o.Username.Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(module))
            q = q.Where(o => o.Module == module);
        if (!string.IsNullOrWhiteSpace(action))
            q = q.Where(o => o.Action == action);
        if (!string.IsNullOrWhiteSpace(targetId))
            q = q.Where(o => o.TargetId == targetId);
        if (!string.IsNullOrWhiteSpace(f.Keyword))
        {
            var k = f.Keyword.Trim();
            q = q.Where(o =>
                (o.TargetId != null && o.TargetId.Contains(k)) ||
                (o.TargetLabel != null && o.TargetLabel.Contains(k)) ||
                (o.Path != null && o.Path.Contains(k)) ||
                (o.Message != null && o.Message.Contains(k)));
        }
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(o => o.CreatedAt).Skip((page - 1) * ps).Take(ps).ToListAsync();
        return new PagedResult<OperationLog>(items, total, page, ps);
    }

    public async Task<PagedResult<QueryLog>> ListQueryLogsAsync(LogFilter f, string? module, string? path)
    {
        var (page, ps) = Normalize(f);
        var q = db.QueryLogs.AsNoTracking().AsQueryable();
        q = ApplyTime(q, f.From, f.To);
        if (!string.IsNullOrWhiteSpace(f.Username))
        {
            var s = f.Username.Trim();
            q = q.Where(x => x.Username != null && x.Username.Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(module))
            q = q.Where(x => x.Module == module);
        if (!string.IsNullOrWhiteSpace(path))
            q = q.Where(x => x.Path != null && x.Path.Contains(path));
        if (!string.IsNullOrWhiteSpace(f.Keyword))
        {
            var k = f.Keyword.Trim();
            q = q.Where(x => (x.Query != null && x.Query.Contains(k)));
        }
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * ps).Take(ps).ToListAsync();
        return new PagedResult<QueryLog>(items, total, page, ps);
    }

    public async Task<PagedResult<ErrorLog>> ListErrorLogsAsync(LogFilter f, string? level, string? path)
    {
        var (page, ps) = Normalize(f);
        var q = db.ErrorLogs.AsNoTracking().AsQueryable();
        q = ApplyTime(q, f.From, f.To);
        if (!string.IsNullOrWhiteSpace(f.Username))
        {
            var s = f.Username.Trim();
            q = q.Where(x => x.Username != null && x.Username.Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(level))
            q = q.Where(x => x.Level == level);
        if (!string.IsNullOrWhiteSpace(path))
            q = q.Where(x => x.Path != null && x.Path.Contains(path));
        if (!string.IsNullOrWhiteSpace(f.Keyword))
        {
            var k = f.Keyword.Trim();
            q = q.Where(x =>
                (x.ExceptionType != null && x.ExceptionType.Contains(k)) ||
                (x.Message != null && x.Message.Contains(k)));
        }
        var total = await q.CountAsync();
        var items = await q.OrderByDescending(x => x.CreatedAt).Skip((page - 1) * ps).Take(ps).ToListAsync();
        return new PagedResult<ErrorLog>(items, total, page, ps);
    }

    // ---------- 工具 ----------
    private static (int Page, int PageSize) Normalize(LogFilter f)
    {
        var page = Math.Max(1, f.Page);
        var ps = Math.Clamp(f.PageSize < 1 ? 20 : f.PageSize, 1, 200);
        return (page, ps);
    }

    private static IQueryable<T> ApplyTime<T>(IQueryable<T> q, DateTimeOffset? from, DateTimeOffset? to) where T : class
    {
        // 4 种日志实体都有 CreatedAt 属性，但未共享基类：用动态谓词构造避免重复
        // 这里用参数化的简单反射式 Where：EF Core 会正确翻译属性名
        // 为避免 EF 解释失败，改为强类型重载版本（在下方）
        if (from.HasValue) q = FilterCreatedAtGreater(q, from.Value);
        if (to.HasValue) q = FilterCreatedAtLess(q, to.Value);
        return q;
    }

    private static IQueryable<T> FilterCreatedAtGreater<T>(IQueryable<T> q, DateTimeOffset v)
    {
        var param = System.Linq.Expressions.Expression.Parameter(typeof(T), "x");
        var prop = System.Linq.Expressions.Expression.Property(param, "CreatedAt");
        var body = System.Linq.Expressions.Expression.GreaterThanOrEqual(prop, System.Linq.Expressions.Expression.Constant(v, typeof(DateTimeOffset)));
        var lambda = System.Linq.Expressions.Expression.Lambda<Func<T, bool>>(body, param);
        return q.Where(lambda);
    }
    private static IQueryable<T> FilterCreatedAtLess<T>(IQueryable<T> q, DateTimeOffset v)
    {
        var param = System.Linq.Expressions.Expression.Parameter(typeof(T), "x");
        var prop = System.Linq.Expressions.Expression.Property(param, "CreatedAt");
        var body = System.Linq.Expressions.Expression.LessThanOrEqual(prop, System.Linq.Expressions.Expression.Constant(v, typeof(DateTimeOffset)));
        var lambda = System.Linq.Expressions.Expression.Lambda<Func<T, bool>>(body, param);
        return q.Where(lambda);
    }
}
