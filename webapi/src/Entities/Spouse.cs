namespace HanJianNet.WebApi.Entities;

public class Spouse
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public string Name { get; set; } = "";
    public string? Remark { get; set; }
}

public class Child
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public string Name { get; set; } = "";
    public string? Gender { get; set; }
    public string? Whereabouts { get; set; }
    public string? Remark { get; set; }
}

public class Residence
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public string Place { get; set; } = "";
    public string? Period { get; set; }
    public string? Remark { get; set; }
}

public class CrimeRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public int? Year { get; set; }
    public string Title { get; set; } = "";
    public string? Process { get; set; }
    public string? Harm { get; set; }
    public string? SourceRef { get; set; }
}

public class LifeEvent
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public int? Year { get; set; }
    public string Event { get; set; } = "";
    public string? SourceRef { get; set; }
}

public class Attachment
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public string Url { get; set; } = "";
    public string Kind { get; set; } = "photo";
    public string FileType { get; set; } = "";
    public string? Caption { get; set; }
}

public class SourceRef
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string TraitorId { get; set; } = "";
    public Traitor Traitor { get; set; } = null!;
    public string Citation { get; set; } = "";
    public int? Credibility { get; set; }
}
