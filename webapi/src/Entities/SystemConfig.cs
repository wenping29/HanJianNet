namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 系统配置项（键值对），按 Category 分组，供 web/webapi/mobileapp 使用。
/// </summary>
public class SystemConfig
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string Category { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
