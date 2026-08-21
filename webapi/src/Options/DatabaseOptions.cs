namespace HanJianNet.WebApi.Options;

public class DatabaseOptions
{
    public string Provider { get; set; } = "Sqlite";
    public SqliteOptions Sqlite { get; set; } = new();
    public MySqlOptions MySql { get; set; } = new();
}

public class SqliteOptions
{
    public string ConnectionString { get; set; } = "Data Source=hanjian.db";
}

public class MySqlOptions
{
    public string ConnectionString { get; set; } = "";
}
