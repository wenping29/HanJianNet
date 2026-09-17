using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Options;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

public class UploadService(IWebHostEnvironment env, IOptions<UploadOptions> uploadOptions, IHttpClientFactory httpFactory)
{
    private readonly UploadOptions _opts = uploadOptions.Value;

    public async Task<UploadResultDto> SaveAsync(IFormFile file, string kind)
    {
        if (kind != "photo" && kind != "evidence" && kind != "avatar")
            throw new ApiException(400, "上传类型仅支持 photo、evidence 或 avatar");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_opts.AllowedTypes.Contains(ext))
            throw new ApiException(400, "不支持的文件类型");
        if (file.Length > _opts.MaxBytes)
            throw new ApiException(400, "文件大小超出限制");

        var id = Guid.NewGuid().ToString("N");
        var fileName = $"{id}{ext}";
        var dir = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, fileName);
        await using var stream = File.Create(path);
        await file.CopyToAsync(stream);

        return new UploadResultDto
        {
            Id = id,
            Url = $"/uploads/{fileName}",
            Kind = kind,
            FileType = ext,
        };
    }

    /// <summary>从远程图片直链下载并保存为本地附件（用于 AI 查询出的候选照片）。</summary>
    public async Task<UploadResultDto> SaveFromUrlAsync(string url, string kind)
    {
        if (kind != "photo" && kind != "evidence")
            throw new ApiException(400, "上传类型仅支持 photo 或 evidence");
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https"))
            throw new ApiException(400, "仅支持 http(s) 图片直链");

        var ext = Path.GetExtension(uri.AbsolutePath).ToLowerInvariant();
        if (!_opts.AllowedTypes.Contains(ext))
            throw new ApiException(400, "不支持的图片类型");

        var client = httpFactory.CreateClient("UploadFetcher");
        client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", "HanJianNet/1.0");
        client.DefaultRequestHeaders.TryAddWithoutValidation("Accept", "image/*");

        byte[] bytes;
        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            bytes = await client.GetByteArrayAsync(url, cts.Token);
        }
        catch (OperationCanceledException)
        {
            throw new TimeoutException("下载图片超时，请重试。");
        }
        catch (HttpRequestException ex)
        {
            throw new InvalidOperationException($"无法下载图片：{ex.Message}");
        }

        if (bytes.Length == 0)
            throw new ApiException(400, "远程图片内容为空");
        if (bytes.LongLength > _opts.MaxBytes)
            throw new ApiException(400, "远程图片超出大小限制");

        var id = Guid.NewGuid().ToString("N");
        var fileName = $"{id}{ext}";
        var dir = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, fileName);
        await File.WriteAllBytesAsync(path, bytes);

        return new UploadResultDto
        {
            Id = id,
            Url = $"/uploads/{fileName}",
            Kind = kind,
            FileType = ext,
        };
    }
}
