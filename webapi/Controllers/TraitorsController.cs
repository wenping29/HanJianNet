using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/traitors")]
public class TraitorsController(TraitorService traitors) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] TraitorFilter filter)
    {
        var items = await traitors.SearchAsync(filter);
        return Ok(new { items });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        return Ok(await traitors.GetStatsAsync());
    }

    [HttpGet("timeline")]
    public async Task<IActionResult> Timeline()
    {
        var items = await traitors.GetTimelineAsync();
        return Ok(new { items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var traitor = await traitors.GetByIdAsync(id);
        return Ok(new { traitor });
    }

    [HttpGet("{id}/revisions")]
    public async Task<IActionResult> Revisions(string id)
    {
        var items = await traitors.GetPublicRevisionsAsync(id);
        return Ok(new { items });
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TraitorInputDto input)
    {
        var revisionId = await traitors.SubmitNewAsync(CurrentUser.GetId(User), input);
        return Ok(new { revisionId });
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TraitorInputDto input)
    {
        var revisionId = await traitors.SubmitEditAsync(CurrentUser.GetId(User), id, input);
        return Ok(new { revisionId });
    }
}
