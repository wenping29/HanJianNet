using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Options;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

public class UploadService
{
    private static readonly Dictionary<string, string[]> AllowedExtensions = new()
    {
        ["photo"] = [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        ["evidence"] = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".txt"],
    };

    private readonly string _rootPath;
    private readonly long _maxBytes;

    public UploadService(IOptions<UploadOptions> options, IWebHostEnvironment env)
    {
        _rootPath = Path.Combine(env.ContentRootPath, options.Value.Root);
        _maxBytes = (long)options.Value.MaxFileSizeMB * 1024 * 1024;
    }

    public async Task<UploadResultDto> SaveAsync(IFormFile file, string kind)
    {
        kind = kind.Trim().ToLowerInvariant();
        if (kind is not ("photo" or "evidence"))
            throw new ApiException(400, "kind 必须为 photo 或 evidence");

        if (file.Length == 0) throw new ApiException(400, "文件为空");
        if (file.Length > _maxBytes)
            throw new ApiException(400, $"文件大小不能超过 {_maxBytes / 1024 / 1024} MB");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions[kind].Contains(ext))
            throw new ApiException(400, $"不支持的文件类型：{ext}");

        var month = DateTime.UtcNow.ToString("yyyyMM");
        var dir = Path.Combine(_rootPath, kind, month);
        Directory.CreateDirectory(dir);

        var id = Guid.NewGuid().ToString("N");
        var fileName = id + ext;
        await using var stream = File.Create(Path.Combine(dir, fileName));
        await file.CopyToAsync(stream);

        return new UploadResultDto
        {
            Id = id,
            Url = $"/uploads/{kind}/{month}/{fileName}",
            Kind = kind,
            FileType = file.ContentType,
        };
    }
}
