namespace HanJianNet.WebApi.Options;

public class UploadOptions
{
    public string Root { get; set; } = "uploads";
    public int MaxFileSizeMB { get; set; } = 20;
}
