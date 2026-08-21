namespace HanJianNet.WebApi.Entities;

public class CrimeRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor? Traitor { get; set; }
    public int? Year { get; set; }
    public string Title { get; set; } = "";
    public string? Process { get; set; }
    public string? Harm { get; set; }
    public string? SourceRef { get; set; }
}
