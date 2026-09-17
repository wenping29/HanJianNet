using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 公开系统配置端点（无需认证），只返回 category="web" 的配置。
/// </summary>
[ApiController]
public class SystemConfigsController(SystemConfigService configs) : ControllerBase
{
    [HttpGet("api/config")]
    public async Task<IActionResult> Get()
    {
        var items = await configs.GetPublicConfigAsync();
        return Ok(new { items });
    }
}
