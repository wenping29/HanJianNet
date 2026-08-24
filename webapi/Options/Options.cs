namespace HanJianNet.WebApi.Options;

public class DatabaseOptions
{
    public string Provider { get; set; } = "sqlite";
    public SqliteOptions Sqlite { get; set; } = new();
}

public class SqliteOptions
{
    public string ConnectionString { get; set; } = "Data Source=hanjian.db";
}

public class JwtOptions
{
    public string SecretKey { get; set; } = "";
    public string Issuer { get; set; } = "HanJianNet";
    public string Audience { get; set; } = "HanJianNet";
    public int ExpireMinutes { get; set; } = 1440;
}

public class UploadOptions
{
    public long MaxBytes { get; set; } = 10 * 1024 * 1024;
    public string[] AllowedTypes { get; set; } = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
}
