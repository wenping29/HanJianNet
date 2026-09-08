using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 前台访客统计控制器（公开）：/api/visits/track 记录一次访问，/api/visits/stats 读取统计。
/// </summary>
[ApiController]
public class VisitsController(VisitService visits) : ControllerBase
{
    /// <summary>POST 记录一次前台访问（body: { token }）。</summary>
    [HttpPost("api/visits/track")]
    public async Task<IActionResult> Track([FromBody] TrackVisitRequest req)
    {
        await visits.TrackAsync(req.Token);
        return Ok(new { ok = true });
    }

    /// <summary>GET 读取总访问量与总访客数。</summary>
    [HttpGet("api/visits/stats")]
    public async Task<IActionResult> Stats() => Ok(await visits.GetStatsAsync());
}

public class TrackVisitRequest
{
    public string? Token { get; set; }
}
