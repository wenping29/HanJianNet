namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 前台导航菜单项，支持启用/停用状态。
/// </summary>
public class WebMenu
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Sort { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
