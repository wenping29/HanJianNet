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

public class RedisOptions
{
    /// <summary>
    /// 是否开启 Redis 缓存。false 时所有缓存读写直接跳过，不影响业务。
    /// </summary>
    public bool Enabled { get; set; } = false;

    /// <summary>
    /// Redis 连接字符串，如 "localhost:6379,password=xxx,defaultDatabase=0"。
    /// </summary>
    public string ConnectionString { get; set; } = "localhost:6379";

    /// <summary>
    /// 缓存键实例前缀，用于多服务/多环境隔离。
    /// </summary>
    public string InstanceName { get; set; } = "hanjian:";

    /// <summary>
    /// 默认缓存过期时间（分钟）。
    /// </summary>
    public int DefaultExpireMinutes { get; set; } = 10;
}
