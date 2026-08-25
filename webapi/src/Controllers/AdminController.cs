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
        => Ok(new { items = await roles.ListAsync() });

    [HttpPut("{role}/menus")]
    public async Task<IActionResult> SetMenus(string role, [FromBody] SaveRoleMenusRequest req)
        => Ok(new { items = await roles.SetMenusAsync(role, req.MenuKeys) });
}

[ApiController]
[Route("api/admin/menus")]
[Authorize]
public class MenusController(MenuService menus) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(new { items = await menus.GetMenusForRoleAsync(CurrentUser.GetRole(User)) });

    [HttpGet("manage")]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<IActionResult> List()
        => Ok(new { items = await menus.ListAsync() });

    [HttpPost]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<IActionResult> Create([FromBody] SaveMenuRequest req)
        => Ok(new { item = await menus.CreateAsync(req) });

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] SaveMenuRequest req)
        => Ok(new { item = await menus.UpdateAsync(id, req) });
}
