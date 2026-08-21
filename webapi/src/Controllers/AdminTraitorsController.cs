using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

[ApiController]
[Route("api/admin/traitors")]
[Authorize(Roles = "admin,superadmin")]
public class AdminTraitorsController(TraitorService traitors) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? name)
    {
        var items = await traitors.SearchAsync(new TraitorFilter { Name = name });
        return Ok(new { items });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(string id)
    {
        var traitor = await traitors.GetByIdAsync(id);
        return Ok(new { traitor });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TraitorInputDto input)
    {
        var traitor = await traitors.CreateDirectAsync(CurrentUser.GetId(User), input);
        return Ok(new { traitor });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TraitorInputDto input)
    {
        var traitor = await traitors.UpdateDirectAsync(CurrentUser.GetId(User), id, input);
        return Ok(new { traitor });
    }
}
