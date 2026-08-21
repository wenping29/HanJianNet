namespace HanJianNet.WebApi.Common;

public static class Roles
{
    public const string SuperAdmin = "superadmin";
    public const string Admin = "admin";
    public const string Manager = "manager";
    public const string User = "user";
    public const string Guest = "guest";

    public static readonly string[] All = [SuperAdmin, Admin, Manager, User, Guest];

    public static readonly string[] Reviewers = [Manager, Admin, SuperAdmin];

    public static readonly string[] Contributors = [User, Manager, Admin, SuperAdmin];

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
