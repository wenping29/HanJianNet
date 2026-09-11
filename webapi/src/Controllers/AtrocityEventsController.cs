using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>历史事件（惨案/宏观事件）。公开读取列表与详情；新增需登录。</summary>
[ApiController]
public class AtrocityEventsController(AtrocityCaseService service) : ControllerBase
{
    [HttpGet("api/atrocity-events")]
    public async Task<IActionResult> List([FromQuery] string? era)
        => Ok(new { items = await service.ListAsync(era) });

    [HttpGet("api/atrocity-events/{id}")]
    public async Task<IActionResult> Get(string id)
        => Ok(new { item = await service.GetAsync(id) });

    [Authorize]
    [HttpPost("api/atrocity-events")]
    public async Task<IActionResult> Create([FromBody] AtrocityEventInputDto input)
        => Ok(new { item = await service.CreateAsync(input) });

    [Authorize]
    [HttpPut("api/atrocity-events/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] AtrocityEventInputDto input)
        => Ok(new { item = await service.UpdateAsync(id, input) });
}