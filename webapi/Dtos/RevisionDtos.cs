namespace HanJianNet.WebApi.Dtos;

public class RevisionDto
{
    public string Id { get; set; } = "";
    public string? TraitorId { get; set; }
    public string SubmitterId { get; set; } = "";
    public UserBriefDto? Submitter { get; set; }
    public DateTime SubmittedAt { get; set; }
    public string ChangeSummary { get; set; } = "";
    public TraitorDto Payload { get; set; } = new();
    public string Status { get; set; } = "pending";
    public string? ReviewerId { get; set; }
    public UserBriefDto? Reviewer { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewResult { get; set; }
    public string? ReviewComment { get; set; }
}

public class ReviewRequest
{
    public string Result { get; set; } = "";
    public string? Comment { get; set; }
}
