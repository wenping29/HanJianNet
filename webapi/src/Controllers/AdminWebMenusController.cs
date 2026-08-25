using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 后台管理：前台导航菜单（WebMenus）的查询与编辑。
/// </summary>
[ApiController]
[Route("api/admin/web-menus")]
[Authorize(Roles = "admin,superadmin")]
public class AdminWebMenusController(AppDbContext db) : ControllerBase
{
    /// <summary>获取所有前台菜单（含停用），按 Sort 升序。</summary>
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var items = await db.WebMenus
            .OrderBy(m => m.Sort)
            .Select(m => new WebMenuDto
            {
                Id = m.Id,
                Key = m.Key,
                Path = m.Path,
                Label = m.Label,
                Sort = m.Sort,
                IsEnabled = m.IsEnabled,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt,
            })
            .ToListAsync();
        return Ok(new { items });
    }

    /// <summary>修改前台菜单（Label/Path/Sort/IsEnabled），不改 Key。</summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] SaveWebMenuRequest req)
    {
        var menu = await db.WebMenus.FirstOrDefaultAsync(m => m.Id == id);
        if (menu is null) return NotFound(new { message = "菜单不存在" });

        if (string.IsNullOrWhiteSpace(req.Label))
            return BadRequest(new { message = "名称不能为空" });
        if (string.IsNullOrWhiteSpace(req.Path))
            return BadRequest(new { message = "路径不能为空" });

        // Path 唯一性校验（排除自身）
        if (await db.WebMenus.AnyAsync(m => m.Path == req.Path && m.Id != id))
            return BadRequest(new { message = $"路径 {req.Path} 已被其他菜单占用" });

        menu.Label = req.Label.Trim();
        menu.Path = req.Path.Trim();
        menu.Sort = req.Sort;
        menu.IsEnabled = req.IsEnabled;
        menu.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(new
        {
            item = new WebMenuDto
            {
                Id = menu.Id,
                Key = menu.Key,
                Path = menu.Path,
                Label = menu.Label,
                Sort = menu.Sort,
                IsEnabled = menu.IsEnabled,
                CreatedAt = menu.CreatedAt,
                UpdatedAt = menu.UpdatedAt,
            },
        });
    }
}

public class SaveWebMenuRequest
{
    public string Label { get; set; } = "";
    public string Path { get; set; } = "";
    public int Sort { get; set; }
    public bool IsEnabled { get; set; }
}
