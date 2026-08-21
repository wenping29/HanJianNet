using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "admin,superadmin")]
public class UsersController(UserService users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await users.ListAsync();
        return Ok(new { items });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        var user = await users.CreateAsync(CurrentUser.GetId(User), req);
        return Ok(new { user });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req)
    {
        var user = await users.UpdateAsync(CurrentUser.GetId(User), id, req);
        return Ok(new { user });
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> ChangeRole(string id, [FromBody] ChangeRoleRequest req)
    {
        var user = await users.ChangeRoleAsync(CurrentUser.GetId(User), id, req.Role);
        return Ok(new { user });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await users.DeleteAsync(CurrentUser.GetId(User), id);
        return Ok(new { message = "删除成功" });
    }
}
