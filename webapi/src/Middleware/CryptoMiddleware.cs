using System.Text;
using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Services;

namespace HanJianNet.WebApi.Middleware;

/// <summary>
/// 通讯加密中间件：按请求头 X-Encrypted: 1 触发。
/// - 请求：若 Body 为 JSON 信封，解密后回写为明文，供模型绑定/日志读取。
/// - 响应：将 JSON 响应体加密为信封，并回写 X-Encrypted: 1 头。
/// 须放在 RequestBodyBufferingMiddleware 之后、控制器之前。
/// </summary>
public class CryptoMiddleware(RequestDelegate next, CryptoService crypto)
{
    private const string HeaderName = "X-Encrypted";
    private const string AlgHeaderName = "X-Crypto-Alg";

    public async Task InvokeAsync(HttpContext ctx)
    {
        var wantsEncrypted = string.Equals(ctx.Request.Headers[HeaderName], "1", StringComparison.Ordinal);
        if (!wantsEncrypted)
        {
            await next(ctx);
            return;
        }

        // 响应使用与客户端能力一致的算法（默认 GCM；HTTP 安全上下文不可用时客户端会声明 cbc）
        var responseAlg = ctx.Request.Headers[AlgHeaderName].FirstOrDefault() ?? "gcm";
        responseAlg = string.Equals(responseAlg, "cbc", StringComparison.OrdinalIgnoreCase) ? "cbc" : "gcm";

        // 服务端未配置密钥时直接失败：避免客户端发送信封而服务端当明文解析导致难排查的异常。
        if (!crypto.IsConfigured)
        {
            ctx.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            ctx.Response.ContentType = "application/json; charset=utf-8";
            ctx.Response.Headers[HeaderName] = "1";
            await ctx.Response.WriteAsync(JsonSerializer.Serialize(new { message = "服务端未配置通讯加密密钥（Security:EncryptionKey）" }, JsonOpts.Default));
            return;
        }

        // ---- 请求体解密 ----
        var contentType = ctx.Request.ContentType ?? "";
        if (ctx.Request.ContentLength != 0 && contentType.Contains("application/json", StringComparison.OrdinalIgnoreCase))
        {
            var requestBody = ctx.Request.Body;
            requestBody.Position = 0;
            string envelope;
            using (var reader = new StreamReader(requestBody, leaveOpen: true))
            {
                envelope = await reader.ReadToEndAsync();
            }
            if (!string.IsNullOrWhiteSpace(envelope))
            {
                try
                {
                    var plaintext = crypto.Decrypt(envelope.Trim());
                    var bytes = Encoding.UTF8.GetBytes(plaintext);
                    ctx.Request.Body = new MemoryStream(bytes);
                    ctx.Request.ContentLength = bytes.Length;
                }
                catch (Exception)
                {
                    // 解密失败返回 400，让客户端明确感知（避免把信封误当业务参数继续处理）
                    ctx.Response.StatusCode = StatusCodes.Status400BadRequest;
                    ctx.Response.ContentType = "application/json; charset=utf-8";
                    ctx.Response.Headers[HeaderName] = "1";
                    await ctx.Response.WriteAsync(crypto.Encrypt(responseAlg, JsonSerializer.Serialize(new { message = "加密请求解密失败，请检查加密密钥是否与服务端一致" }, JsonOpts.Default)));
                    return;
                }
            }
        }

        // ---- 响应加密 ----
        var originalBody = ctx.Response.Body;
        using var buffer = new MemoryStream();
        ctx.Response.Body = buffer;
        try
        {
            await next(ctx);
        }
        finally
        {
            ctx.Response.Body = originalBody;
        }

        if (ctx.Response.HasStarted) return;

        buffer.Position = 0;
        var responseType = ctx.Response.ContentType ?? "";
        var isJson = responseType.Contains("application/json", StringComparison.OrdinalIgnoreCase);
        if (isJson && buffer.Length > 0)
        {
            string raw;
            using (var reader = new StreamReader(buffer, leaveOpen: true))
            {
                raw = await reader.ReadToEndAsync();
            }
            ctx.Response.ContentType = "application/json; charset=utf-8";
            ctx.Response.Headers[HeaderName] = "1";
            await ctx.Response.WriteAsync(crypto.Encrypt(responseAlg, raw));
        }
        else
        {
            buffer.Position = 0;
            await buffer.CopyToAsync(originalBody);
        }
    }
}