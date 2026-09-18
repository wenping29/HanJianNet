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
public class TraitorsController(TraitorService traitors, AiService ai) : ControllerBase
{
    // ---------- 公开接口 ----------

    /// <summary>
    /// 公开列表。分页方式二选一：
    /// - 页码模式（兼容旧客户端）：传 page/pageSize，返回 total/totalPages；
    /// - 游标模式（Keyset，深翻页性能恒定）：查询串带 cursor 键（空值 = 第一页），
    ///   响应不含有效 total（-1），用 nextCursor 续翻，nextCursor 为 null 表示没有下一页；
    /// - 两者都不传返回全量（地图统计场景）。
    /// </summary>
    [HttpGet("api/traitors")]
    public async Task<IActionResult> List([FromQuery] string? name,[FromQuery] int? yearFrom,[FromQuery] int? yearTo,
        [FromQuery] string? @event,[FromQuery] string? period,[FromQuery] string? province,[FromQuery] int? page = null,[FromQuery] int? pageSize = null)
    {
        // 查询串出现 cursor 键（即使为空）即进入游标模式；旧客户端不带 cursor，行为不变
        string? cursor = Request.Query.TryGetValue("cursor", out var c) ? c.ToString() : null;
        try
        {
            var paged = await traitors.ListAsync(name, yearFrom, yearTo, @event, period, province, page, pageSize, cursor);
            return Ok(new { items = paged.Items, total = paged.Total, page = paged.Page, pageSize = paged.PageSize, totalPages = paged.TotalPages, nextCursor = paged.NextCursor });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("api/traitors/{id}")]
    public async Task<IActionResult> Get(string id)=> Ok(new { traitor = await traitors.GetAsync(id) });

    [HttpGet("api/traitors/{id}/revisions")]
    public async Task<IActionResult> GetRevisions(string id)=> Ok(new { items = await traitors.GetRevisionsAsync(id) });

    [HttpGet("api/traitors/stats")]
    public async Task<IActionResult> GetStats()=> Ok(await traitors.GetStatsAsync());

    [HttpGet("api/traitors/province-stats")]
    public async Task<IActionResult> GetProvinceStats()=> Ok(await traitors.GetProvinceStatsAsync());

    [HttpGet("api/traitors/timeline")]
    public async Task<IActionResult> GetTimeline()=> Ok(new { items = await traitors.GetTimelineAsync() });

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
    public async Task<IActionResult> AdminList([FromQuery] string? name, [FromQuery] int? harmLevel, [FromQuery] bool? hasPhoto, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var paged = await traitors.AdminListAsync(name, harmLevel, hasPhoto, page, pageSize);
        return Ok(new { paged.Items, paged.Total, paged.Page, paged.PageSize, paged.TotalPages });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpGet("api/admin/traitors/{id}")]
    public async Task<IActionResult> AdminGet(string id)=> Ok(new { traitor = await traitors.AdminGetAsync(id) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors")]
    public async Task<IActionResult> AdminCreate([FromBody] TraitorInputDto input)=> Ok(new { traitor = await traitors.AdminCreateAsync(input) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpPut("api/admin/traitors/{id}")]
    public async Task<IActionResult> AdminUpdate(string id, [FromBody] TraitorInputDto input)=> Ok(new { traitor = await traitors.AdminUpdateAsync(id, input) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpGet("api/admin/traitors/duplicates")]
    public async Task<IActionResult> AdminDuplicates([FromQuery] string? name, [FromQuery] string? nativePlace)
        => Ok(new { items = await traitors.FindDuplicatesAsync(name, nativePlace) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors/merge")]
    public async Task<IActionResult> AdminMerge([FromBody] MergeRequestDto req)
        => Ok(new { traitor = await traitors.MergeAsync(req) });

    [Authorize(Roles = "admin,superadmin")]
    [HttpDelete("api/admin/traitors/{id}")]
    public async Task<IActionResult> AdminDelete(string id)
    {
        await traitors.AdminDeleteAsync(id);
        return Ok(new { message = "删除成功" });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpDelete("api/admin/traitors/{id}/photos")]
    public async Task<IActionResult> AdminDeletePhotos(string id)
    {
        var count = await traitors.AdminDeletePhotosAsync(id);
        return Ok(new { message = "照片已删除", count });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors/batch-delete")]
    public async Task<IActionResult> AdminBatchDelete([FromBody] BatchIdsRequest req)
    {
        var count = await traitors.AdminBatchDeleteAsync(req.Ids);
        return Ok(new { message = "批量删除成功", count });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpPatch("api/admin/traitors/{id}/harm-level")]
    public async Task<IActionResult> AdminUpdateHarmLevel(string id, [FromBody] UpdateHarmLevelRequest req)
    {
        await traitors.AdminUpdateHarmLevelAsync(id, req.HarmLevel);
        return Ok(new { message = "危害等级已更新" });
    }

    /// <summary>快速下架/恢复单条档案：应对内容投诉等场景，下架后前台不再展示。</summary>
    [Authorize(Roles = "admin,superadmin")]
    [HttpPatch("api/admin/traitors/{id}/status")]
    public async Task<IActionResult> AdminSetStatus(string id, [FromBody] SetTraitorStatusRequest req)
    {
        var username = CurrentUser.GetTriple(User).Username ?? "";
        var traitor = await traitors.AdminSetHiddenAsync(id, req.Hidden, req.Reason, username);
        return Ok(new { traitor, message = req.Hidden ? "档案已下架" : "档案已恢复" });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors/batch-delete-photos")]
    public async Task<IActionResult> AdminBatchDeletePhotos([FromBody] BatchIdsRequest req)
    {
        var count = await traitors.AdminBatchDeletePhotosAsync(req.Ids);
        return Ok(new { message = "照片已删除", count });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors/batch-export")]
    public async Task<IActionResult> AdminBatchExport([FromBody] BatchIdsRequest req)
    {
        var items = await traitors.AdminExportAsync(req.Ids);
        return Ok(new { items });
    }

    [Authorize(Roles = "admin,superadmin")]
    [HttpPost("api/admin/traitors/ai-query")]
    public async Task<IActionResult> AdminAiQuery([FromBody] AiTraitorQueryDto req)
    {
        var result = await ai.QueryTraitorAsync(req.Name);
        return Ok(new { result });
    }
}

/// <summary>TraitorInputDto + ChangeSummary，用于用户提交修订。</summary>
public class TraitorSubmitRequest : TraitorInputDto
{
    public string ChangeSummary { get; set; } = "";
}

/// <summary>批量操作请求：Id 列表。</summary>
public class BatchIdsRequest
{
    public List<string> Ids { get; set; } = [];
}

/// <summary>更新危害等级请求。</summary>
public class UpdateHarmLevelRequest
{
    /// <summary>危害度分级：1=特级 … 7=己级；null=未分级</summary>
    public int? HarmLevel { get; set; }
}

/// <summary>下架/恢复档案状态请求。</summary>
public class SetTraitorStatusRequest
{
    /// <summary>true=下架（屏蔽公开展示）；false=恢复上架。</summary>
    public bool Hidden { get; set; }
    /// <summary>下架原因（如内容投诉），恢复时忽略。</summary>
    public string? Reason { get; set; }
}
