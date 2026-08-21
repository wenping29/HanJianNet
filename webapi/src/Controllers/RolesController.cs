using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/admin/roles")]
[Authorize(Roles = "admin,superadmin")]
public class RolesController(RoleService roles) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await roles.ListAsync();
        return Ok(new { items });
    }

    [HttpPut("{role}/menus")]
    public async Task<IActionResult> SetMenus(string role, [FromBody] SaveRoleMenusRequest req)
    {
        var items = await roles.SetMenusAsync(role, req.MenuKeys);
        return Ok(new { items });
    }
}
