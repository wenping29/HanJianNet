namespace HanJianNet.WebApi.Entities;

public class Attachment
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor? Traitor { get; set; }
    public string Url { get; set; } = "";
    public string Kind { get; set; } = "photo";
    public string FileType { get; set; } = "";
    public string? Caption { get; set; }
}
