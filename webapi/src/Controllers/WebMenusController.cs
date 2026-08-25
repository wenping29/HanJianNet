using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 前台导航菜单控制器：公开查询已启用的菜单列表。
/// </summary>
[ApiController]
public class WebMenusController(AppDbContext db) : ControllerBase
{
    /// <summary>获取所有已启用的前台菜单，按 Sort 升序排列。</summary>
    [HttpGet("api/web-menus")]
    public async Task<IActionResult> List()
    {
        var items = await db.WebMenus
            .Where(m => m.IsEnabled)
            .OrderBy(m => m.Sort)
            .Select(m => new WebMenuDto
            {
                Id = m.Id,
                Key = m.Key,
                Path = m.Path,
                Label = m.Label,
                Sort = m.Sort,
                IsEnabled = m.IsEnabled,
            })
            .ToListAsync();
        return Ok(new { items });
    }
}

public class WebMenuDto
{
    public string Id { get; set; } = "";
    public string Key { get; set; } = "";
    public string Path { get; set; } = "";
    public string Label { get; set; } = "";
    public int Sort { get; set; }
    public bool IsEnabled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
