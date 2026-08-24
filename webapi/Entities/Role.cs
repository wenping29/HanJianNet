namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 角色表：Key 为唯一标识（与 User.Role 对应），Sort 决定显示顺序，
/// IsBuiltIn 标记系统内置角色（不可删除）。
/// </summary>
public class Role
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int Sort { get; set; }
    public bool IsBuiltIn { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
