using System.Text.Json;
using System.Text.Json.Serialization;

namespace HanJianNet.WebApi.Common;

public static class JsonOpts
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.Never,
    };
}

public class ApiException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}
