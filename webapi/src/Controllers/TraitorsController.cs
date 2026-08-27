using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 档案控制器：公开读取（/api/traitors）与管理员直接操作（/api/admin/traitors）。
/// 普通用户提交修订经 /api/traitors POST/PUT，管理员直接写入经 /api/admin/traitors。
/// </summary>
[ApiController]
public class TraitorsController(TraitorService traitors) : ControllerBase
{
    // ---------- 公开接口 ----------

    [HttpGet("api/traitors")]
    public async Task<IActionResult> List(
        [FromQuery] string? name,
        [FromQuery] int? yearFrom,
        [FromQuery] int? yearTo,
        [FromQuery] string? @event,
        [FromQuery] string? period,
        [FromQuery] string? nativePlace,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null)
    {
        var paged = await traitors.ListAsync(name, yearFrom, yearTo, @event, period, nativePlace, page, pageSize);
        return Ok(new { items = paged.Items, total = paged.Total, page = paged.Page, pageSize = paged.PageSize, totalPages = paged.TotalPages });
    }

    [HttpGet("api/traitors/{id}")]
    public async Task<IActionResult> Get(string id)
        => Ok(new { traitor = await traitors.GetAsync(id) });

    [HttpGet("api/traitors/{id}/revisions")]
    public async Task<IActionResult> GetRevisions(string id)
        => Ok(new { items = await traitors.GetRevisionsAsync(id) });

    [HttpGet("api/traitors/stats")]
    public async Task<IActionResult> GetStats()
        => Ok(await traitors.GetStatsAsync());

    [HttpGet("api/traitors/timeline")]
    public async Task<IActionResult> GetTimeline()
        => Ok(new { items = await traitors.GetTimelineAsync() });

    // ---------- 用户提交修订（需登录） ----------

    [Authorize]
    [HttpPost("api/traitors")]
    public async Task<IActionResult> Create([FromBody] TraitorSubmitRequest req)
    {
        var rid = await traitors.CreateAsync(req, req.ChangeSummary, CurrentUser.GetId(User));
        return Ok(new { revisionId = rid });
    }

    [Authorize]
    [HttpPut("api/traitors/{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] TraitorSubmitRequest req)
    {
        var rid = await traitors.UpdateAsync(id, req, req.ChangeSummary, CurrentUser.GetId(User));
        return Ok(new { revisionId = rid });
    }

    // ---------- 管理员直接操作 ----------

    [Authorize(Roles = "admin,superadmin")]
    [HttpGet("api/admin/traitors")]
    public async Task<IActionResult> AdminList([FromQuery] string? name, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var paged = await traitors.AdminListAsync(name, page, pageSize);
        return Ok(new { paged.Items, paged.Total, paged.Page, paged.PageSize, paged.TotalPages });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpGet("api/admin/traitors/{id}")]
    public async Task<IActionResult> AdminGet(string id)
        => Ok(new { traitor = await traitors.AdminGetAsync(id) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors")]
    public async Task<IActionResult> AdminCreate([FromBody] TraitorInputDto input)
        => Ok(new { traitor = await traitors.AdminCreateAsync(input) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpPut("api/admin/traitors/{id}")]
    public async Task<IActionResult> AdminUpdate(string id, [FromBody] TraitorInputDto input)
        => Ok(new { traitor = await traitors.AdminUpdateAsync(id, input) });
}

/// <summary>TraitorInputDto + ChangeSummary，用于用户提交修订。</summary>
public class TraitorSubmitRequest : TraitorInputDto
{
    public string ChangeSummary { get; set; } = "";
}
