namespace HanJianNet.WebApi.Dtos;

public class SpouseInputDto
{
    public string Name { get; set; } = "";
    public string? Remark { get; set; }
}

public class ChildInputDto
{
    public string Name { get; set; } = "";
    public string? Gender { get; set; }
    public string? Whereabouts { get; set; }
    public string? Remark { get; set; }
}

public class ResidenceInputDto
{
    public string Place { get; set; } = "";
    public string? Period { get; set; }
    public string? Remark { get; set; }
}

public class CrimeRecordInputDto
{
    public int? Year { get; set; }
    public string Title { get; set; } = "";
    public string? Process { get; set; }
    public string? Harm { get; set; }
    public string? SourceRef { get; set; }
}

public class LifeEventInputDto
{
    public int? Year { get; set; }
    public string Event { get; set; } = "";
    public string? SourceRef { get; set; }
}

public class SourceInputDto
{
    public string Citation { get; set; } = "";
    public int? Credibility { get; set; }
}

public class AttachmentInputDto
{
    public string Id { get; set; } = "";
    public string Url { get; set; } = "";
    public string Kind { get; set; } = "photo";
    public string FileType { get; set; } = "";
    public string? Caption { get; set; }
}

public class TraitorInputDto
{
    public string ChangeSummary { get; set; } = "";
    public string Name { get; set; } = "";
    public string? CourtesyName { get; set; }
    public string? Pseudonym { get; set; }
    public int? BirthYear { get; set; }
    public int? DeathYear { get; set; }
    public string BirthYearType { get; set; } = "exact";
    public string DeathYearType { get; set; } = "exact";
    public string NativePlace { get; set; } = "";
    public List<string> Aliases { get; set; } = [];
    public List<string> IdentityTags { get; set; } = [];
    public string Period { get; set; } = "民国";
    public string Faction { get; set; } = "";
    public string Summary { get; set; } = "";
    public List<SpouseInputDto> Spouses { get; set; } = [];
    public List<ChildInputDto> Children { get; set; } = [];
    public List<ResidenceInputDto> Residences { get; set; } = [];
    public List<CrimeRecordInputDto> CrimeRecords { get; set; } = [];
    public List<AttachmentInputDto> Attachments { get; set; } = [];
    public List<SourceInputDto> Sources { get; set; } = [];
    public List<LifeEventInputDto> LifeEvents { get; set; } = [];
    public List<string> RelatedIds { get; set; } = [];
}

public class TraitorSnapshotDto
{
    public string Name { get; set; } = "";
    public string? CourtesyName { get; set; }
    public string? Pseudonym { get; set; }
    public int? BirthYear { get; set; }
    public int? DeathYear { get; set; }
    public string BirthYearType { get; set; } = "exact";
    public string DeathYearType { get; set; } = "exact";
    public string NativePlace { get; set; } = "";
    public List<string> Aliases { get; set; } = [];
    public List<string> IdentityTags { get; set; } = [];
    public string Period { get; set; } = "民国";
    public string Faction { get; set; } = "";
    public string Summary { get; set; } = "";
    public List<SpouseInputDto> Spouses { get; set; } = [];
    public List<ChildInputDto> Children { get; set; } = [];
    public List<ResidenceInputDto> Residences { get; set; } = [];
    public List<CrimeRecordInputDto> CrimeRecords { get; set; } = [];
    public List<AttachmentInputDto> Attachments { get; set; } = [];
    public List<SourceInputDto> Sources { get; set; } = [];
    public List<LifeEventInputDto> LifeEvents { get; set; } = [];
    public List<string> RelatedIds { get; set; } = [];
}

public class TraitorSummaryDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Period { get; set; } = "";
    public string Faction { get; set; } = "";
    public int? BirthYear { get; set; }
    public int? DeathYear { get; set; }
    public string BirthYearType { get; set; } = "exact";
    public string DeathYearType { get; set; } = "exact";
    public List<string> IdentityTags { get; set; } = [];
    public string? PhotoUrl { get; set; }
}

public class TraitorDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? CourtesyName { get; set; }
    public string? Pseudonym { get; set; }
    public int? BirthYear { get; set; }
    public int? DeathYear { get; set; }
    public string BirthYearType { get; set; } = "exact";
    public string DeathYearType { get; set; } = "exact";
    public string NativePlace { get; set; } = "";
    public List<string> Aliases { get; set; } = [];
    public List<string> IdentityTags { get; set; } = [];
    public string Period { get; set; } = "";
    public string Faction { get; set; } = "";
    public string Summary { get; set; } = "";
    public List<SpouseInputDto> Spouses { get; set; } = [];
    public List<ChildInputDto> Children { get; set; } = [];
    public List<ResidenceInputDto> Residences { get; set; } = [];
    public List<CrimeRecordInputDto> CrimeRecords { get; set; } = [];
    public List<AttachmentInputDto> Attachments { get; set; } = [];
    public List<SourceInputDto> Sources { get; set; } = [];
    public List<LifeEventInputDto> LifeEvents { get; set; } = [];
    public List<string> RelatedIds { get; set; } = [];
}

public class StatsDto
{
    public int Total { get; set; }
    public int Sentenced { get; set; }
    public int ChildrenInfo { get; set; }
    public int DescendantsStatus { get; set; }
}

public class TimelineNodeDto
{
    public string Id { get; set; } = "";
    public int? Year { get; set; }
    public string Event { get; set; } = "";
    public string? TraitorId { get; set; }
    public string? TraitorName { get; set; }
}

public class TraitorFilter
{
    public string? Name { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public string? Event { get; set; }
    public string? Period { get; set; }
}
