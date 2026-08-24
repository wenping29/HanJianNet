namespace HanJianNet.WebApi.Dtos;

public class RevisionDto
{
    public string Id { get; set; } = "";
    public string? TraitorId { get; set; }
    public string SubmitterId { get; set; } = "";
    public UserBriefDto? Submitter { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string ChangeSummary { get; set; } = "";
    public TraitorDto Payload { get; set; } = null!;
    public string Status { get; set; } = "";
    public string? ReviewerId { get; set; }
    public UserBriefDto? Reviewer { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewResult { get; set; }
    public string? ReviewComment { get; set; }
}

public record RevisionStatusStats(int Pending, int Approved, int Rejected, int Total);
