using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Controllers;

/// <summary>
/// 前台「联系我」留言控制器（公开）：访客提交留言，匿名即可提交。
/// 留言保存在 ContactMessages 表，管理员在后台查看与处理。
/// </summary>
[ApiController]
public class ContactMessagesController(AppDbContext db) : ControllerBase
{
    /// <summary>提交一条联系留言。</summary>
    [HttpPost("api/contact-messages")]
    public async Task<IActionResult> Submit([FromBody] SubmitContactMessageRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "请填写留言标题" });
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { message = "请填写留言内容" });
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "请填写您的姓名" });
        if (string.IsNullOrWhiteSpace(req.Contact))
            return BadRequest(new { message = "请留下联系方式" });

        var title = req.Title.Trim();
        var content = req.Content.Trim();
        if (title.Length > 200)
            return BadRequest(new { message = "标题不能超过 200 字" });
        if (content.Length > 5000)
            return BadRequest(new { message = "内容不能超过 5000 字" });
        if (req.Name.Trim().Length > 64)
            return BadRequest(new { message = "姓名不能超过 64 字" });
        if (req.Contact.Trim().Length > 200)
            return BadRequest(new { message = "联系方式不能超过 200 字" });

        var item = new ContactMessage
        {
            Title = title,
            Content = content,
            Name = req.Name.Trim(),
            Contact = req.Contact.Trim(),
            Ip = Request.HttpContext.Connection.RemoteIpAddress?.ToString(),
        };

        db.ContactMessages.Add(item);
        await db.SaveChangesAsync();
        return Ok(new { ok = true, id = item.Id });
    }
}

public class SubmitContactMessageRequest
{
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Name { get; set; } = "";
    public string Contact { get; set; } = "";
}