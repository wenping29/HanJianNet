namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 前台访客访问记录。每条记录一次页面访问（PV），VisitorToken 为访客唯一标识，
/// 去重后即得访客数（UV）。
/// </summary>
public class VisitLog
{
    public long Id { get; set; }
    public string VisitorToken { get; set; } = "";
    /// <summary>被访问的前台路由路径（不含 query），仅 pathname，如 /roster</summary>
    public string Path { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
