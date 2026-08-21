namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 后台导航菜单项，Roles 为逗号分隔的可见角色列表。
/// </summary>
public class MenuItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
    public string Roles { get; set; } = "";
}
