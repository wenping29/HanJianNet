namespace HanJianNet.WebApi.Entities;

/// <summary>站内通知：审核结果等消息推送给提交人。</summary>
public class AppNotification
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string UserId { get; set; } = "";
    public User? User { get; set; }
    /// <summary>通知类型（如 revision_approved / revision_rejected），前端按类型渲染本地化文案。</summary>
    public string Type { get; set; } = "";
    /// <summary>关联对象名称（如档案姓名），作为文案参数。</summary>
    public string ReferenceName { get; set; } = "";
    /// <summary>附加内容（如审核意见），原样展示。</summary>
    public string? Comment { get; set; }
    public string? RevisionId { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
