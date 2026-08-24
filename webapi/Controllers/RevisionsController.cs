using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/admin/revisions")]
[Authorize(Roles = "manager,admin,superadmin")]
public class RevisionsController(RevisionService revisions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status)
        => Ok(new { items = await revisions.ListAsync(status) });

    [HttpGet("stats/status")]
    public async Task<IActionResult> StatusStats()
        => Ok(new { stats = await revisions.StatusStatsAsync() });

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
        => Ok(new { revision = await revisions.GetAsync(id) });

    [HttpPost("{id}/review")]
    public async Task<IActionResult> Review(string id, [FromBody] ReviewRequest req)
        => Ok(new { revision = await revisions.ReviewAsync(id, CurrentUser.GetId(User), req.Result, req.Comment) });
}

public class ReviewRequest
{
    public string Result { get; set; } = "";
    public string? Comment { get; set; }
}
