namespace HanJianNet.WebApi.Dtos;

/// <summary>事件涉案人员 DTO。</summary>
public class AtrocityCasePersonDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Location { get; set; }
    public string? IdentityTags { get; set; }
    public int Sort { get; set; }
}

/// <summary>历史事件列表项 DTO。</summary>
public class AtrocityEventDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string EventType { get; set; } = "";
    public string Era { get; set; } = "";
    public int? Year { get; set; }
    public string Province { get; set; } = "";
    public string City { get; set; } = "";
    public bool IsGeneral { get; set; }
    public int PersonCount { get; set; }
    public string Summary { get; set; } = "";
    public List<string> Keywords { get; set; } = [];
}

/// <summary>历史事件详情 DTO（含涉案人员）。</summary>
public class AtrocityEventDetailDto : AtrocityEventDto
{
    public string Alias { get; set; } = "";
    public string Location { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<AtrocityCasePersonDto> Persons { get; set; } = [];
}

/// <summary>历史事件新增入参（需登录）。</summary>
public class AtrocityEventInputDto
{
    public string Name { get; set; } = "";
    public string? Alias { get; set; }
    public string? EventType { get; set; }
    public string? Era { get; set; }
    public int? Year { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public string? Location { get; set; }
    public bool IsGeneral { get; set; }
    public int PersonCount { get; set; }
    public string? Summary { get; set; }
    public List<string> Keywords { get; set; } = [];
}

/// <summary>AI 查询请求：按事件名称从 DeepSeek 等平台检索史料并整理。</summary>
public class AiEventQueryDto
{
    public string Name { get; set; } = "";
}

/// <summary>
/// AI 查询结果（历史事件）：由 DeepSeek 返回的 JSON 解析而来。
/// 字段取值与 AtrocityEventInputDto 对齐，无法确证的字段为 null / 空。
/// </summary>
public class AiEventResultDto
{
    public string Name { get; set; } = "";
    public string? Alias { get; set; }
    public string? EventType { get; set; }
    public string? Era { get; set; }
    public int? Year { get; set; }
    public string? Province { get; set; }
    public string? City { get; set; }
    public string? Location { get; set; }
    public bool IsGeneral { get; set; }
    public int? PersonCount { get; set; }
    public string? Summary { get; set; }
    public List<string> Keywords { get; set; } = [];
}