namespace HanJianNet.WebApi.Entities;

public class Spouse
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor? Traitor { get; set; }
    public string Name { get; set; } = "";
    public string? Remark { get; set; }
}
