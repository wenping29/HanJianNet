using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController(RevisionService revisions) : ControllerBase
{
    [HttpGet("submissions")]
    public async Task<IActionResult> Submissions()
    {
        var items = await revisions.MySubmissionsAsync(CurrentUser.GetId(User));
        return Ok(new { items });
    }
}
