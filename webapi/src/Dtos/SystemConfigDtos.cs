namespace HanJianNet.WebApi.Dtos;

public class SystemConfigDto
{
    public string Id { get; set; } = "";
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public string Category { get; set; } = "";
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateConfigRequest
{
    public string Value { get; set; } = "";
    public string? Description { get; set; }
}
