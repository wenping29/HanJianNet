namespace HanJianNet.WebApi.Common;

/// <summary>
/// 内置角色常量与层级工具。角色层级（Rank）数值越大权限越高。
/// 数据库 Role 表会种子这些内置角色，User.Role 字段存储角色 Key。
/// </summary>
public static class Roles
{
    public const string SuperAdmin = "superadmin";
    public const string Admin = "admin";
    public const string Manager = "manager";
    public const string User = "user";
    public const string Guest = "guest";

    public static readonly string[] All = [SuperAdmin, Admin, Manager, User, Guest];

    /// <summary>可审核修订的角色。</summary>
    public static readonly string[] Reviewers = [Manager, Admin, SuperAdmin];

    /// <summary>可提交修订的角色。</summary>
    public static readonly string[] Contributors = [User, Manager, Admin, SuperAdmin];

    /// <summary>可管理用户的角色。</summary>
    public static readonly string[] UserManagers = [Admin, SuperAdmin];

    /// <summary>角色层级，数值越大权限越高。</summary>
    public static int Rank(string role) => role switch
    {
        SuperAdmin => 4,
        Admin => 3,
        Manager => 2,
        User => 1,
        Guest => 0,
        _ => -1,
    };

    public static bool IsValid(string role) => Rank(role) >= 0;

    public static bool AtLeast(string role, string baseline) => Rank(role) >= Rank(baseline);
}

/// <summary>
/// 业务异常：携带 HTTP 状态码与中文消息，由 ExceptionHandlingMiddleware 统一转换为 JSON 响应。
/// </summary>
public class ApiException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
