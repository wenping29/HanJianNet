namespace HanJianNet.WebApi.Entities;

/// <summary>
/// 前台访客访问记录。每条记录一次访问（PV），VisitorToken 为访客唯一标识，
/// 去重后即得访客数（UV）。
/// </summary>
public class VisitLog
{
    public long Id { get; set; }
    public string VisitorToken { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
