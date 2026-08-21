namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 权限表：每条权限对应一个后台菜单，Key 与菜单 Key 一致；
/// 角色经 RolePermissions 关联权限后即可见对应菜单。
/// </summary>
public class Permission
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Label { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
