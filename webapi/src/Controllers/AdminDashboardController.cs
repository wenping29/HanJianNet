using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 后台数据看板：服务器/数据库运行状态、站点数据总览与每日登录用户趋势。
/// 仅 admin 及以上角色可查。
/// </summary>
[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "admin,superadmin")]
public class AdminDashboardController(DashboardService dashboard) : ControllerBase
{
    /// <summary>总览：服务器状态、数据库状态与各项计数</summary>
    [HttpGet("overview")]
    public async Task<IActionResult> Overview()
    {
        var data = await dashboard.GetOverviewAsync();
        return Ok(new { server = data.Server, database = data.Database, counts = data.Counts });
    }

    /// <summary>每日登录用户趋势，days 默认 14（收敛到 7~90）</summary>
    [HttpGet("login-trend")]
    public async Task<IActionResult> LoginTrend([FromQuery] int days = 14)
        => Ok(new { items = await dashboard.GetLoginTrendAsync(days) });
}
