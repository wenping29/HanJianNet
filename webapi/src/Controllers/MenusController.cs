using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/admin/menus")]
[Authorize]
public class MenusController(MenuService menus) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var role = User.FindFirst("role")?.Value ?? "guest";
        var items = await menus.GetMenusForRoleAsync(role);
        return Ok(new { items });
    }

    [HttpGet("manage")]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<IActionResult> List()
    {
        var items = await menus.ListAsync();
        return Ok(new { items });
    }

    [HttpPost]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<IActionResult> Create([FromBody] SaveMenuRequest req)
    {
        var item = await menus.CreateAsync(req);
        return Ok(new { item });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,superadmin")]
    public async Task<IActionResult> Update(string id, [FromBody] SaveMenuRequest req)
    {
        var item = await menus.UpdateAsync(id, req);
        return Ok(new { item });
    }
}
