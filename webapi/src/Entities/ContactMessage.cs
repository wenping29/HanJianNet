namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 前台「联系我」留言表单，访客可匿名提交，管理员在后台查看。
/// </summary>
public class ContactMessage
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    /// <summary>留言标题</summary>
    public string Title { get; set; } = "";
    /// <summary>留言内容</summary>
    public string Content { get; set; } = "";
    /// <summary>留言人姓名</summary>
    public string Name { get; set; } = "";
    /// <summary>留言人留下的联系方式（邮箱/手机/微信号等）</summary>
    public string Contact { get; set; } = "";
    /// <summary>提交者 IP</summary>
    public string? Ip { get; set; }
    /// <summary>是否标记为已读/已处理</summary>
    public bool IsHandled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? HandledAt { get; set; }
}