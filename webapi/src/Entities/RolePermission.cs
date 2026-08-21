namespace HanJianNet.WebApi.Entities;

/// <summary>角色-权限关联表：角色拥有某条权限即代表其可见对应菜单。</summary>
public class RolePermission
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RoleId { get; set; } = "";
    public string PermissionId { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public AppRole Role { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
}
