using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 后台管理：前台联系留言的查询 / 标记处理 / 删除。仅 admin 及以上角色可操作。
/// </summary>
[ApiController]
[Route("api/admin/contact-messages")]
[Authorize(Roles = "admin,superadmin")]
public class AdminContactMessagesController(AppDbContext db) : ControllerBase
{
    /// <summary>分页查询联系留言，可按关键词（姓名/标题/内容/联系方式）与处理状态筛选，按提交时间倒序。</summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? keyword,
        [FromQuery] bool? handled,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.ContactMessages.AsQueryable();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim();
            query = query.Where(m =>
                m.Name.Contains(kw) ||
                m.Title.Contains(kw) ||
                m.Content.Contains(kw) ||
                m.Contact.Contains(kw));
        }
        if (handled.HasValue)
            query = query.Where(m => m.IsHandled == handled.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new ContactMessageDto
            {
                Id = m.Id,
                Title = m.Title,
                Content = m.Content,
                Name = m.Name,
                Contact = m.Contact,
                Ip = m.Ip,
                IsHandled = m.IsHandled,
                CreatedAt = m.CreatedAt,
                HandledAt = m.HandledAt,
            })
            .ToListAsync();

        var paged = new PagedResult<ContactMessageDto>(items, total, page, pageSize);
        return Ok(new
        {
            items = paged.Items,
            total = paged.Total,
            page = paged.Page,
            pageSize = paged.PageSize,
            totalPages = paged.TotalPages,
        });
    }

    /// <summary>切换留言的已处理状态。</summary>
    [HttpPatch("{id}/handled")]
    public async Task<IActionResult> SetHandled(string id, [FromBody] SetHandledRequest req)
    {
        var item = await db.ContactMessages.FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return NotFound(new { message = "留言不存在" });

        item.IsHandled = req.Handled;
        item.HandledAt = req.Handled ? DateTime.UtcNow : null;
        await db.SaveChangesAsync();
        return Ok(new { ok = true, message = req.Handled ? "已标记为已处理" : "已恢复为待处理" });
    }

    /// <summary>删除一条联系留言。</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var item = await db.ContactMessages.FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return NotFound(new { message = "留言不存在" });

        db.ContactMessages.Remove(item);
        await db.SaveChangesAsync();
        return Ok(new { message = "已删除" });
    }
}

public class ContactMessageDto
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Name { get; set; } = "";
    public string Contact { get; set; } = "";
    public string? Ip { get; set; }
    public bool IsHandled { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? HandledAt { get; set; }
}

public class SetHandledRequest
{
    public bool Handled { get; set; }
}