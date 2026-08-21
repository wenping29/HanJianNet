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
    public IActionResult Get()
    {
        var role = User.FindFirst("role")?.Value ?? "guest";
        var items = menus.GetMenusForRole(role);
        return Ok(new { items });
    }
}
