using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// Admin 系统配置管理：查询全部、按 ID 更新值。
/// </summary>
[ApiController]
[Route("api/admin/system-configs")]
[Authorize(Roles = "admin,superadmin")]
public class AdminSystemConfigsController(SystemConfigService configs) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await configs.ListAsync();
        return Ok(new { items });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateConfigRequest req)
    {
        var item = await configs.UpdateAsync(id, req);
        if (item is null) return NotFound(new { message = "配置项不存在" });
        return Ok(new { item });
    }
}
