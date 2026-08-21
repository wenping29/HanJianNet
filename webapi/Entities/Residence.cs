namespace HanJianNet.WebApi.Entities;

public class Residence
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor? Traitor { get; set; }
    public string Place { get; set; } = "";
    public string? Period { get; set; }
    public string? Remark { get; set; }
}
