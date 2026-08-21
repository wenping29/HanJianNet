namespace HanJianNet.WebApi.Entities;

public class LifeEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor? Traitor { get; set; }
    public int? Year { get; set; }
    public string Event { get; set; } = "";
    public string? SourceRef { get; set; }
}
