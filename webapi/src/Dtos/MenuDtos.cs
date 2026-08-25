namespace HanJianNet.WebApi.Dtos;

public class MenuItemDto
{
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
    public List<MenuItemDto> Children { get; set; } = [];
}

public class MenuItemAdminDto
{
    public string Id { get; set; } = "";
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
    public string[] Roles { get; set; } = [];
    public string? Parent { get; set; }
}

public class SaveMenuRequest
{
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
    public string[] Roles { get; set; } = [];
    public string? Parent { get; set; }
}
