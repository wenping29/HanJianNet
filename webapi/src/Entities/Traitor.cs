namespace HanJianNet.WebApi.Entities;

public class Traitor
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "";
    public string? CourtesyName { get; set; }
    public string? Pseudonym { get; set; }
    public int? BirthYear { get; set; }
    public int? DeathYear { get; set; }
    public string BirthYearType { get; set; } = "exact";
    public string DeathYearType { get; set; } = "exact";
    public string NativePlace { get; set; } = "";
    public string Province { get; set; } = "";
    public string AliasesJson { get; set; } = "[]";
    public string IdentityTagsJson { get; set; } = "[]";
    public string Period { get; set; } = "";
    public string Faction { get; set; } = "";
    public string Summary { get; set; } = "";
    public string RelatedIdsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Spouse> Spouses { get; set; } = [];
    public List<Child> Children { get; set; } = [];
    public List<Residence> Residences { get; set; } = [];
    public List<CrimeRecord> CrimeRecords { get; set; } = [];
    public List<Attachment> Attachments { get; set; } = [];
    public List<SourceRef> Sources { get; set; } = [];
    public List<LifeEvent> LifeEvents { get; set; } = [];
    public List<Revision> Revisions { get; set; } = [];
}
