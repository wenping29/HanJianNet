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
        => Ok(new { items = await users.ListAsync() });

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
        => Ok(new { user = await users.CreateAsync(CurrentUser.GetId(User), req) });

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest req)
        => Ok(new { user = await users.UpdateAsync(CurrentUser.GetId(User), id, req) });

    [HttpPut("{id}/role")]
    public async Task<IActionResult> ChangeRole(string id, [FromBody] ChangeRoleRequest req)
        => Ok(new { user = await users.ChangeRoleAsync(CurrentUser.GetId(User), id, req.Role) });

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        await users.DeleteAsync(CurrentUser.GetId(User), id);
        return Ok(new { message = "删除成功" });
    }
}

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController(UserService users) : ControllerBase
{
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
        => Ok(new { user = await users.UpdateProfileAsync(CurrentUser.GetId(User), req) });

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        await users.ChangePasswordAsync(CurrentUser.GetId(User), req);
        return Ok(new { message = "密码已修改" });
    }

    [HttpGet("submissions")]
    public async Task<IActionResult> MySubmissions()
        => Ok(new { items = await users.MySubmissionsAsync(CurrentUser.GetId(User)) });
}
