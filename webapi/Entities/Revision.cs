namespace HanJianNet.WebApi.Entities;

public class Revision
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string? TraitorId { get; set; }
    public Traitor? Traitor { get; set; }

    public string SubmitterId { get; set; } = "";
    public User? Submitter { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public string ChangeSummary { get; set; } = "";

    public string PayloadJson { get; set; } = "{}";

    public string Status { get; set; } = "pending";

    public string? ReviewerId { get; set; }
    public User? Reviewer { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewResult { get; set; }
    public string? ReviewComment { get; set; }
}
