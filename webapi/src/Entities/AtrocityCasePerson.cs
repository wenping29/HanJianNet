namespace HanJianNet.WebApi.Entities;

/// <summary>事件涉案人员（atrocitycasepersons 表）。</summary>
public class AtrocityCasePerson
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AtrocityCaseId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Location { get; set; } = "";
    public string IdentityTags { get; set; } = "";
    public int Sort { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public AtrocityCase? Case { get; set; }
}