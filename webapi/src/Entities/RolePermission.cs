namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 角色-权限关联表：以角色 Key 与权限 Key 关联，
/// 角色拥有某条权限即代表其可见对应菜单。
/// </summary>
public class RolePermission
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RoleKey { get; set; } = "";
    public string PermissionKey { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
