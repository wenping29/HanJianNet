namespace HanJianNet.WebApi.Options;

public class DatabaseOptions
{
    public string Provider { get; set; } = "sqlite";
    public SqliteOptions Sqlite { get; set; } = new();
    public MySqlOptions Mysql { get; set; } = new();
}

public class SqliteOptions
{
    public string ConnectionString { get; set; } = "Data Source=hanjian.db";
}

public class MySqlOptions
{
    public string ConnectionString { get; set; } =
        "Server=localhost;Port=3306;Database=hanjian;User=root;Password=root";

    /// <summary>
    /// MySQL 服务器版本，如 "8.0.36"、"10.6.15-mariadb"；
    /// 留空则启动时自动探测（AutoDetect 需要数据库可连通）。
    /// </summary>
    public string ServerVersion { get; set; } = "";
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
