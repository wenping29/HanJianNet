using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Options;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

/// <summary>加解密信封：v=版本，alg=gcm|cbc，iv=随机向量，data=密文(Base64)。</summary>
public class CryptoEnvelope
{
    public int V { get; set; } = 1;
    public string Alg { get; set; } = "gcm";
    public string Iv { get; set; } = "";
    public string Data { get; set; } = "";
}

/// <summary>
/// 通讯加密服务：前端与 WebApi 之间按请求头 X-Encrypted 触发。
/// 优先 AES-256-GCM（Web Crypto 可用时），非安全上下文兜底 AES-CBC(PKCS7)。
/// 两端共享 Security:EncryptionKey 的 Base64 AES 密钥。
/// </summary>
public class CryptoService
{
    private const int GcmTagSize = 16;
    private const int GcmNonceSize = 12;

    private readonly byte[]? _key;

    public CryptoService(IOptions<SecurityOptions> options)
    {
        var raw = options.Value.EncryptionKey;
        if (!string.IsNullOrWhiteSpace(raw))
        {
            try
            {
                var key = Convert.FromBase64String(raw);
                if (key.Length is not (16 or 24 or 32))
                    throw new FormatException($"密钥长度 {key.Length} 字节，应为 16/24/32 字节");
                _key = key;
            }
            catch (FormatException ex)
            {
                throw new InvalidOperationException("Security:EncryptionKey 必须是 Base64 编码的 16/24/32 字节 AES 密钥", ex);
            }
        }
    }

    /// <summary>是否已配置通讯加密密钥。</summary>
    public bool IsConfigured => _key is not null;

    /// <summary>加密明文 JSON，返回 AES-GCM 信封 JSON 字符串。</summary>
    public string Encrypt(string plaintext) => Encrypt("gcm", plaintext);

    /// <summary>按算法（gcm/cbc）加密明文 JSON，返回信封 JSON 字符串。</summary>
    public string Encrypt(string alg, string plaintext)
    {
        if (_key is null) throw new InvalidOperationException("服务端未配置通讯加密密钥（Security:EncryptionKey）");

        if (string.Equals(alg, "cbc", StringComparison.OrdinalIgnoreCase))
        {
            var cbcIv = RandomNumberGenerator.GetBytes(16);
            byte[] ciphertext;
            using (var aes = Aes.Create())
            {
                aes.Key = _key;
                aes.IV = cbcIv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;
                using (var enc = aes.CreateEncryptor())
                {
                    ciphertext = enc.TransformFinalBlock(Encoding.UTF8.GetBytes(plaintext), 0, Encoding.UTF8.GetByteCount(plaintext));
                }
            }
            return JsonSerializer.Serialize(new CryptoEnvelope
            {
                V = 1,
                Alg = "cbc",
                Iv = Convert.ToBase64String(cbcIv),
                Data = Convert.ToBase64String(ciphertext),
            }, JsonOpts.Default);
        }

        var plain = Encoding.UTF8.GetBytes(plaintext);
        var iv = RandomNumberGenerator.GetBytes(GcmNonceSize);
        var ct = new byte[plain.Length];
        var tag = new byte[GcmTagSize];
        using (var gcm = new AesGcm(_key, GcmTagSize))
        {
            gcm.Encrypt(iv, plain, ct, tag);
        }
        var payload = new byte[ct.Length + tag.Length];
        Buffer.BlockCopy(ct, 0, payload, 0, ct.Length);
        Buffer.BlockCopy(tag, 0, payload, ct.Length, tag.Length);
        var envelope = new CryptoEnvelope
        {
            V = 1,
            Alg = "gcm",
            Iv = Convert.ToBase64String(iv),
            Data = Convert.ToBase64String(payload),
        };
        return JsonSerializer.Serialize(envelope, JsonOpts.Default);
    }

    /// <summary>解密信封 JSON，返回明文 JSON 字符串。算法由信封 alg 字段决定。</summary>
    public string Decrypt(string envelopeJson)
    {
        if (_key is null) throw new InvalidOperationException("服务端未配置通讯加密密钥（Security:EncryptionKey）");
        CryptoEnvelope? env;
        try
        {
            env = JsonSerializer.Deserialize<CryptoEnvelope>(envelopeJson, JsonOpts.Default);
        }
        catch (JsonException ex)
        {
            throw new InvalidDataException("加密信封格式错误", ex);
        }
        if (env is null) throw new InvalidDataException("加密信封为空");
        if (env.V != 1) throw new InvalidDataException($"不支持的加密信封版本：{env.V}");

        var iv = Convert.FromBase64String(env.Iv);
        var data = Convert.FromBase64String(env.Data);

        if (string.Equals(env.Alg, "cbc", StringComparison.OrdinalIgnoreCase))
        {
            if (iv.Length != 16) throw new InvalidDataException("CBC IV 长度应为 16 字节");
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;
            byte[] plain;
            using (var dec = aes.CreateDecryptor())
            {
                plain = dec.TransformFinalBlock(data, 0, data.Length);
            }
            return Encoding.UTF8.GetString(plain);
        }

        // gcm
        if (iv.Length != GcmNonceSize) throw new InvalidDataException("GCM nonce 长度应为 12 字节");
        if (data.Length < GcmTagSize) throw new InvalidDataException("密文长度不足");
        var tag = data[^GcmTagSize..];
        var ct = data[..^GcmTagSize];
        var result = new byte[ct.Length];
        try
        {
            using var gcm = new AesGcm(_key, GcmTagSize);
            gcm.Decrypt(iv, ct, tag, result);
        }
        catch (CryptographicException ex)
        {
            throw new InvalidDataException("解密失败，可能是加密密钥不一致", ex);
        }
        return Encoding.UTF8.GetString(result);
    }
}