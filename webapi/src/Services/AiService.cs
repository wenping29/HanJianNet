using System.Net.Http.Headers;
using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Options;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

/// <summary>
/// AI 史料查询服务：调用 DeepSeek（OpenAI 兼容 /chat/completions）整理汉奸生平等信息。
/// 查询结果仅作为草稿参考，须由管理员人工核对后写入。
/// </summary>
public class AiService(IOptions<DeepSeekOptions> options, IHttpClientFactory httpFactory, ILogger<AiService> logger)
{
    private readonly DeepSeekOptions _options = options.Value;
    private readonly HttpClient _http = httpFactory.CreateClient("DeepSeek");
    private readonly ILogger<AiService> _logger = logger;

    private static readonly string[] AllowedYearTypes = ["exact", "approx", "before", "after", "unknown"];

    public async Task<AiTraitorResultDto> QueryTraitorAsync(string name, CancellationToken ct = default)
    {
        name = name?.Trim() ?? "";
        if (name.Length == 0)
            throw new ArgumentException("汉奸姓名不能为空。");
        if (name.Length > 30)
            throw new ArgumentException("姓名过长，无法查询。");

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new InvalidOperationException(
                "DeepSeek API Key 未配置：请在环境变量 DEEPSEEK__ApiKey 或 appsettings.json 的 DeepSeek:ApiKey 中填写。");

        var payload = new
        {
            model = _options.Model,
            messages = new[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = $"请检索并整理以下历史人物的生平史料：\n姓名：{name}" },
            },
            temperature = 0.3,
            max_tokens = _options.MaxTokens,
            response_format = new { type = "json_object" },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = JsonContent.Create(payload, options: JsonOpts.Default);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            throw new TimeoutException("AI 查询超时，请稍后重试。");
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException($"无法连接 AI 服务：{ex.Message}");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                if (errorBody.Length > 500) errorBody = errorBody[..500];
                _logger.LogError("DeepSeek 请求失败：{StatusCode} {Body}", (int)response.StatusCode, errorBody);
                throw new InvalidOperationException($"AI 服务返回错误（{(int)response.StatusCode}），请稍后重试。");
            }

            using var root = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var content =
                root.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            if (string.IsNullOrWhiteSpace(content))
                throw new InvalidOperationException("AI 服务返回内容为空。");

            var result = DeserializeAiResult(ExtractJson(content));
            return Sanitize(result, name);
        }
    }

    private static AiTraitorResultDto DeserializeAiResult(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<AiTraitorResultDto>(json, JsonOpts.Default)
                ?? throw new InvalidOperationException("AI 返回内容无法解析，请重试。");
        }
        catch (JsonException)
        {
            throw new InvalidOperationException("AI 返回内容不是有效的 JSON，请重试。");
        }
    }

    /// <summary>去除可能的 Markdown 代码块围栏，取最外层 JSON 对象。</summary>
    private static string ExtractJson(string content)
    {
        var text = content.Trim();
        if (text.StartsWith("```"))
        {
            var firstNl = text.IndexOf('\n');
            text = firstNl >= 0 ? text[(firstNl + 1)..] : text[3..];
            text = text.Trim().TrimEnd('`');
        }
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start) return text;
        return text[start..(end + 1)];
    }

    private static AiTraitorResultDto Sanitize(AiTraitorResultDto result, string fallbackName)
    {
        result.Name = string.IsNullOrWhiteSpace(result.Name) ? fallbackName : result.Name.Trim();
        result.CourtesyName = NullIfEmpty(result.CourtesyName);
        result.Pseudonym = NullIfEmpty(result.Pseudonym);
        result.NativePlace = result.NativePlace?.Trim() ?? "";
        result.BirthPlace = result.BirthPlace?.Trim() ?? "";
        result.Faction = result.Faction?.Trim() ?? "";
        result.Summary = result.Summary?.Trim() ?? "";
        result.PhotoNote = NullIfEmpty(result.PhotoNote);

        result.Aliases = CleanList(result.Aliases);
        result.IdentityTags = CleanList(result.IdentityTags);

        result.BirthYear = ValidYear(result.BirthYear);
        result.DeathYear = ValidYear(result.DeathYear);
        result.BirthYearType = NormalizeYearType(result.BirthYearType);
        result.DeathYearType = NormalizeYearType(result.DeathYearType);
        result.Period = NormalizePeriod(result.Period);

        result.Spouses = result.Spouses
            .Where(s => !string.IsNullOrWhiteSpace(s.Name))
            .Select(s => { s.Name = s.Name.Trim(); s.Remark = NullIfEmpty(s.Remark); return s; })
            .ToList();

        result.Children = result.Children
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .Select(c =>
            {
                c.Name = c.Name.Trim();
                c.Gender = NormalizeGender(c.Gender);
                c.Whereabouts = NullIfEmpty(c.Whereabouts);
                c.Remark = NullIfEmpty(c.Remark);
                return c;
            })
            .ToList();

        result.CrimeRecords = result.CrimeRecords
            .Where(c => !string.IsNullOrWhiteSpace(c.Title))
            .Select(c =>
            {
                c.Year = ValidYear(c.Year);
                c.Title = c.Title.Trim();
                c.Process = NullIfEmpty(c.Process);
                c.Harm = NullIfEmpty(c.Harm);
                c.SourceRef = NullIfEmpty(c.SourceRef);
                return c;
            })
            .ToList();

        result.LifeEvents = result.LifeEvents
            .Where(e => !string.IsNullOrWhiteSpace(e.Event))
            .Select(e =>
            {
                e.Year = ValidYear(e.Year);
                e.Event = e.Event.Trim();
                e.SourceRef = NullIfEmpty(e.SourceRef);
                return e;
            })
            .ToList();

        result.Photos = result.Photos
            .Where(p => IsValidPhotoUrl(p.Url))
            .Take(5)
            .Select(p => new AiPhotoDto
            {
                Url = p.Url.Trim(),
                Caption = NullIfEmpty(p.Caption),
                Source = NullIfEmpty(p.Source),
            })
            .ToList();

        return result;
    }

    private static bool IsValidPhotoUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var uri)) return false;
        if (uri.Scheme is not ("http" or "https")) return false;
        var path = uri.AbsolutePath;
        return path.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeYearType(string? type)
    {
        var v = type?.Trim().ToLowerInvariant();
        return AllowedYearTypes.Contains(v) ? v! : "unknown";
    }

    private static string NormalizePeriod(string? period)
    {
        var s = period?.Trim() ?? "";
        if (s is "" or "unknown" or "不详") return "";
        if (s == "其他") return "其他";
        if (s.Contains("宋末")) return "宋末";
        if (s.Contains("明末")) return "明末";
        if (s.Contains("清末") || s.Contains("晚清")) return "清末";
        if (s.Contains("抗日战争") || s.Contains("抗战")) return "抗日战争时期";
        if (s.Contains("民国")) return "民国";
        return "";
    }

    private static string? NormalizeGender(string? gender)
    {
        var g = gender?.Trim();
        return g is "男" or "女" or "不详" ? g : null;
    }

    private static int? ValidYear(int? year)
    {
        if (year is null or < 1 or > 2100) return null;
        return year;
    }

    private static List<string> CleanList(List<string> list) =>
        list
            .Select(s => s?.Trim() ?? "")
            .Where(s => s.Length > 0 && s.Length <= 30)
            .Distinct()
            .ToList();

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private const string SystemPrompt =
        "你是中国近代史史料整理助手，专研民国与抗日战争时期历史。请根据给定人名检索并整理其生平史料，只输出一个 JSON 对象，不要输出 JSON 以外的任何文字、不要用 Markdown。" +
        "JSON 结构如下：" +
        "{ \"name\":\"主名\", \"courtesyName\":\"字\", \"pseudonym\":\"号\", \"birthYear\":1893, \"birthYearType\":\"exact\", \"deathYear\":1946, \"deathYearType\":\"exact\"," +
        " \"nativePlace\":\"籍贯\", \"birthPlace\":\"出生地\", \"period\":\"民国\", \"faction\":\"派系/阵营\", \"aliases\":[\"别名\",\"笔名\"], \"identityTags\":[\"伪县长\",\"汪伪官员\"]," +
        " \"summary\":\"200-400字人生概述，叙述生平与历史评价\", \"spouses\":[{\"name\":\"\",\"remark\":\"\"}],\"children\":[{\"name\":\"\",\"gender\":\"男\",\"whereabouts\":\"\",\"remark\":\"\"}]," +
        " \"crimeRecords\":[{\"year\":1937,\"title\":\"罪行名称\",\"process\":\"经过\",\"harm\":\"危害后果\"}],\"lifeEvents\":[{\"year\":1932,\"event\":\"事件\"}],\"photoNote\":\"照片一句说明\"," +
        " \"photos\":[{\"url\":\"https://...\",\"caption\":\"照片描述\",\"source\":\"来源\"}] }" +
        "要求：1. 基于真实可考史料，宁缺毋滥，宁可留空也不要编造；2. birthYear 用公元年、无法确证填 null，birthYearType 仅可取值 exact(精确)/approx(约)/before(某年前)/after(某年后)/unknown(不详)，deathYear 同理；" +
        "3. period 仅可取值：宋末、明末、清末、民国、抗日战争时期、其他；4. crimeRecords 刻画该人物投敌卖国、为虎作伥的具体罪行，无可靠记录留空数组；5. 字符串均为纯文本、不用 Markdown；6. 若该姓名无可靠史料或为不知名者，仍按结构输出、不确定字段留空；" +
        "7. 关于配偶子女：凡史料确有其人的配偶与子女必须全部填入 spouses/children 数组，spouse.remark 可写配偶身份背景，child.gender 仅可取值 男/女/不详，child.whereabouts 填人物去向变迁，无确切信息填 null；family 是重要字段，勿因简略而漏填。" +
        "8. 关于照片 photos：仅当你确定该人物存在可公开访问的图片直链（如维基共享、博物馆/档案馆公开图库等）时才填入，url 必须以 http(s):// 开头且为图片直链（.jpg/.jpeg/.png/.webp）；无法确认真实可访问的图片时 photos 必须返回空数组，绝不编造 URL。每张照片给出 caption（照片内容描述）与 source（来源网站）。";
}