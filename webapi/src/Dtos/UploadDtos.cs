using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace HanJianNet.WebApi.Dtos;

public class UploadRequestDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
    public string Kind { get; set; } = "";
}

public class UploadResultDto
{
    public string Id { get; set; } = "";
    public string Url { get; set; } = "";
    public string Kind { get; set; } = "";
    public string FileType { get; set; } = "";
}
