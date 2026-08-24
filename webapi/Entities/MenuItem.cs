namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 后台导航菜单项：Parent 为上级菜单 Key（空表示顶级），最多支持两级。
/// 菜单可见性以 RolePermissions 表为准（菜单 Key 即权限 Key）。
/// </summary>
public class MenuItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public string? Icon { get; set; }
    public int Sort { get; set; }
    public string? Parent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
