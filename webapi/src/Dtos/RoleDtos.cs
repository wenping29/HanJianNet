namespace HanJianNet.WebApi.Dtos;

public class RoleDto
{
    public string Key { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public int Sort { get; set; }
    public bool IsBuiltIn { get; set; }
    public int UserCount { get; set; }
}

public class RoleMenuDto
{
    public string Role { get; set; } = "";
    public string Label { get; set; } = "";
    public int UserCount { get; set; }
    public string[] MenuKeys { get; set; } = [];
}

public class SaveRoleMenusRequest
{
    public string[] MenuKeys { get; set; } = [];
}
