using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController(RevisionService revisions, UserService users) : ControllerBase
{
    [HttpGet("submissions")]
    public async Task<IActionResult> Submissions()
    {
        var items = await revisions.MySubmissionsAsync(CurrentUser.GetId(User));
        return Ok(new { items });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest req)
    {
        var user = await users.UpdateProfileAsync(CurrentUser.GetId(User), req);
        return Ok(new { user });
    }

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        await users.ChangePasswordAsync(CurrentUser.GetId(User), req);
        return Ok(new { message = "密码修改成功" });
    }
}
