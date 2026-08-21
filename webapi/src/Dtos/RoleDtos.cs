namespace HanJianNet.WebApi.Dtos;

/// <summary>角色菜单配置项（角色管理页：角色 × 菜单可见性矩阵）。</summary>
public class RoleMenuDto
{
    public string Role { get; set; } = "";
    public string Label { get; set; } = "";
    public int UserCount { get; set; }
    public string[] MenuKeys { get; set; } = [];
}

/// <summary>保存角色可见菜单请求。</summary>
public class SaveRoleMenusRequest
{
    public string[] MenuKeys { get; set; } = [];
}
