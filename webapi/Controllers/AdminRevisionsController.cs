using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/admin/revisions")]
[Authorize(Roles = "admin")]
public class AdminRevisionsController(RevisionService revisions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        var items = await revisions.AdminListAsync(status);
        return Ok(new { items });
    }

    [HttpGet("{rid}")]
    public async Task<IActionResult> Get(string rid)
    {
        var revision = await revisions.AdminGetAsync(rid);
        return Ok(new { revision });
    }

    [HttpPost("{rid}/review")]
    public async Task<IActionResult> Review(string rid, [FromBody] ReviewRequest req)
    {
        var revision = await revisions.ReviewAsync(CurrentUser.GetId(User), rid, req);
        return Ok(new { revision });
    }
}
