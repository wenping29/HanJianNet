namespace HanJianNet.WebApi.Options;

public class JwtOptions
{
    public string Issuer { get; set; } = "hanjiannet";
    public string Audience { get; set; } = "hanjiannet";
    public string SecretKey { get; set; } = "";
    public int ExpireMinutes { get; set; } = 10080;
}
