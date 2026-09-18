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
    public string BirthPlace { get; set; } = "";
    public string? Province { get; set; } = "";
    public string AliasesJson { get; set; } = "[]";
    public string IdentityTagsJson { get; set; } = "[]";
    public string Period { get; set; } = "";
    public string Faction { get; set; } = "";
    public string Summary { get; set; } = "";
    public string RelatedIdsJson { get; set; } = "[]";

    /// <summary>危害度分级：1=特级 2=甲级 3=乙级 4=丙级 5=丁级 6=戊级 7=己级；null=未分级</summary>
    public int? HarmLevel { get; set; }

    /// <summary>伪职：从 Summary 提取的职位，例如「伪县长」「维持会会长」；null=未提取到</summary>
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>合并目标记录 Id（非空表示该记录已被合并到主记录，不再参与重复检测与公开展示）</summary>
    public string? MergedIntoId { get; set; }
    public DateTime? MergedAt { get; set; }

    /// <summary>是否已下架（屏蔽公开展示）。应对内容投诉时快速下架，前台列表/详情/统计不再返回。</summary>
    public bool IsHidden { get; set; }
    /// <summary>下架原因（如内容投诉、信息待核实等）。</summary>
    public string? HiddenReason { get; set; }
    /// <summary>下架时间（UTC）。</summary>
    public DateTime? HiddenAt { get; set; }
    /// <summary>下架操作人用户名。</summary>
    public string? HiddenBy { get; set; }

    public List<Spouse> Spouses { get; set; } = [];
    public List<Child> Children { get; set; } = [];
    public List<Residence> Residences { get; set; } = [];
    public List<CrimeRecord> CrimeRecords { get; set; } = [];
    public List<Attachment> Attachments { get; set; } = [];
    public List<SourceRef> Sources { get; set; } = [];
    public List<LifeEvent> LifeEvents { get; set; } = [];
    public List<Revision> Revisions { get; set; } = [];
}
