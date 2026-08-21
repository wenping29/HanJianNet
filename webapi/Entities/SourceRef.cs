namespace HanJianNet.WebApi.Entities;

public class SourceRef
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor? Traitor { get; set; }
    public string Citation { get; set; } = "";
    public int? Credibility { get; set; }
}
