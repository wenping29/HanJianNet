namespace HanJianNet.WebApi.Entities;

/// <summary>历史事件/惨案（atrocitycases 表）。</summary>
public class AtrocityCase
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "";
    public string Alias { get; set; } = "";
    public string EventType { get; set; } = "";
    public string Era { get; set; } = "";
    public int? Year { get; set; }
    public string Province { get; set; } = "";
    public string City { get; set; } = "";
    public string Location { get; set; } = "";
    public bool IsGeneral { get; set; }
    public int PersonCount { get; set; }
    public string Summary { get; set; } = "";
    /// <summary>关联检索关键词（JSON 数组字符串）。</summary>
    public string Keywords { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<AtrocityCasePerson> Persons { get; set; } = [];
}