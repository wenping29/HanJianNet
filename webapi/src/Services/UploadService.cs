using HanJianNet.WebApi.Common;
using HanJianNet.WebApi.Dtos;
using HanJianNet.WebApi.Options;
using Microsoft.Extensions.Options;

namespace HanJianNet.WebApi.Services;

public class UploadService(IWebHostEnvironment env, IOptions<UploadOptions> uploadOptions)
{
    private readonly UploadOptions _opts = uploadOptions.Value;

    public async Task<UploadResultDto> SaveAsync(IFormFile file, string kind)
    {
        if (kind != "photo" && kind != "evidence")
            throw new ApiException(400, "上传类型仅支持 photo 或 evidence");

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
}
