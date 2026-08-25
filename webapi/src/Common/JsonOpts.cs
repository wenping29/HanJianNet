using System.Text.Json;

namespace HanJianNet.WebApi.Common;

/// <summary>
/// 全局 JSON 序列化选项：驼峰命名、不区分大小写、允许尾随逗号。
/// </summary>
public static class JsonOpts
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        AllowTrailingCommas = true,
        WriteIndented = false,
    };
}
