namespace HanJianNet.WebApi.Dtos;

/// <summary>导航菜单项（按角色过滤后返回给前端）。</summary>
public class MenuItemDto
{
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
}

/// <summary>菜单管理列表项（含完整配置）。</summary>
public class MenuItemAdminDto
{
    public string Id { get; set; } = "";
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
    public string[] Roles { get; set; } = [];
}

/// <summary>新增/修改菜单请求。</summary>
public class SaveMenuRequest
{
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Order { get; set; }
    public string[] Roles { get; set; } = [];
}
