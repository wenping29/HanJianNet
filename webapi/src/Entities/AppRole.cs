namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 角色表：Key 与 User.Role 及菜单可见性中的角色标识对应；
/// Rank 为层级（数值越大权限越高），IsBuiltIn 标记系统内置角色。
/// </summary>
public class AppRole
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    public int Rank { get; set; }
    public bool IsBuiltIn { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
