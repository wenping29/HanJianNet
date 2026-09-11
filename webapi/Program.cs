using System.Text;
using HanJianNet.WebApi.Data;
using HanJianNet.WebApi.Filters;
using HanJianNet.WebApi.Middleware;
using HanJianNet.WebApi.Options;
using HanJianNet.WebApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext());

    builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
    builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
    builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection("Uploads"));
    builder.Services.Configure<RedisOptions>(builder.Configuration.GetSection("Redis"));

    var databaseOptions = builder.Configuration.GetSection("Database").Get<DatabaseOptions>() ?? new DatabaseOptions();
    builder.Services.AddDbContext<AppDbContext>(options =>
    {
        switch (databaseOptions.Provider.Trim().ToLowerInvariant())
        {
            case "sqlite":
                options.UseSqlite(databaseOptions.Sqlite.ConnectionString);
                break;
            case "mysql":
                options.UseMySql(
                    databaseOptions.Mysql.ConnectionString,
                    string.IsNullOrWhiteSpace(databaseOptions.Mysql.ServerVersion)
                        ? ServerVersion.AutoDetect(databaseOptions.Mysql.ConnectionString)
                        : ServerVersion.Parse(databaseOptions.Mysql.ServerVersion));
                break;
            default:
                throw new NotSupportedException($"未知的数据库 Provider：{databaseOptions.Provider}");
        }
    });

    var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(o =>
        {
            o.MapInboundClaims = false;
            o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
                NameClaimType = "username",
                RoleClaimType = "role",
            };
        });
    builder.Services.AddAuthorization();

    // --- Redis 缓存（Redis:Enabled 开启；关闭时退化为内存缓存占位，CacheService 内部直接跳过） ---
    var redisOptions = builder.Configuration.GetSection("Redis").Get<RedisOptions>() ?? new RedisOptions();
    Console.WriteLine($"Redis:Enabled={redisOptions.Enabled}");
    Console.WriteLine($"Redis:ConnectionString={redisOptions.ConnectionString}");
    Console.WriteLine($"Redis:InstanceName={redisOptions.InstanceName}");
    Console.WriteLine($"Redis:DefaultExpireMinutes={redisOptions.DefaultExpireMinutes}");
    if (redisOptions.Enabled)
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisOptions.ConnectionString;
            options.InstanceName = redisOptions.InstanceName ?? "";
        });
        Log.Information("Redis 缓存已启用：{ConnectionString}", redisOptions.ConnectionString);
    }
    else
    {
        // 未开启 Redis：注册内存缓存占位，保证 IDistributedCache 可解析（CacheService 会跳过缓存）
        builder.Services.AddDistributedMemoryCache();
        Log.Information("Redis 缓存未启用（Redis:Enabled=false），缓存功能已关闭");
    }

    var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
    builder.Services.AddCors(o => o.AddPolicy("frontend", p => p
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

    // --- 审计/日志 ---
    // 允许服务层（如 AuthService）直接访问 HttpContext
    builder.Services.AddHttpContextAccessor();
    // 日志写入服务（4 类）+ 分页查询
    builder.Services.AddScoped<LogService>();

    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<UserService>();
    builder.Services.AddScoped<RoleService>();
    builder.Services.AddScoped<MenuService>();
    builder.Services.AddScoped<TraitorService>();
    builder.Services.AddScoped<RevisionService>();
    builder.Services.AddScoped<UploadService>();
    // 历史事件（惨案/宏观事件）
    builder.Services.AddScoped<AtrocityCaseService>();
    // 分布式缓存服务
    builder.Services.AddScoped<CacheService>();
    // 前台访客统计
    builder.Services.AddScoped<VisitService>();

    builder.Services.AddControllers(options =>
    {
        // 全局审计过滤器
        options.Filters.Add<AuditActionFilter>();
    })
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            options.JsonSerializerOptions.AllowTrailingCommas = true;
        });

    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "HanJianNet WebApi",
            Version = "v1",
            Description = "HanJianNet 后端接口文档（登录/操作/查询/错误 4 类系统日志已接入）",
        });

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "请输入登录接口返回的 JWT Token（无需 Bearer 前缀）",
        });
        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer",
                    },
                },
                []
            },
        });
    });

    var app = builder.Build();

    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "{RemoteIpAddress} {RequestMethod} {RequestPath} -> {StatusCode} ({Elapsed:0.000} ms)";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RemoteIpAddress", httpContext.Connection.RemoteIpAddress);
        };
    });

    // 先启用请求体缓冲（允许审计过滤器和错误中间件重读 body）
    app.UseMiddleware<RequestBodyBufferingMiddleware>();
    // 提取请求级审计上下文（IP/UA/用户信息 + 计时器）
    app.UseMiddleware<AuditEnrichmentMiddleware>();
    // 异常 → 响应 + 写错误日志
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "uploads"));
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
            Path.Combine(app.Environment.ContentRootPath, "uploads")),
        RequestPath = "/uploads",
    });

    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseCors("frontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        await DbInitHelpers.EnsureMissingTablesAsync(db);
        await DbSeeder.SeedAsync(db, builder.Configuration);
    }

    Log.Information("HanJianNet WebApi 启动完成，环境：{Environment}", app.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "HanJianNet WebApi 启动失败");
}
finally
{
    Log.CloseAndFlush();
}

static class DbInitHelpers
{
    /// <summary>
    /// EnsureCreated 只在数据库不存在时建全部表；对于已存在的库，新加的实体表/列不会自动创建。
    /// 这里增量补齐缺失的表与列，兼容 SQLite 与 MySQL。
    /// </summary>
    public static async Task EnsureMissingTablesAsync(AppDbContext db)
    {
        await EnsureTableAsync(db, "VisitLogs", "VisitLogs.sqlite.sql", "VisitLogs.mysql.sql");
        await EnsureTableAsync(db, "atrocitycases", "AtrocityCases.sqlite.sql", "AtrocityCases.mysql.sql");

        // 补齐 Traitors 表的新增列（MergedIntoId / MergedAt）
        await EnsureColumnAsync(db, "Traitors", "MergedIntoId",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN MergedIntoId TEXT;"
                : "ALTER TABLE Traitors ADD COLUMN MergedIntoId VARCHAR(64) NULL;");
        await EnsureColumnAsync(db, "Traitors", "MergedAt",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN MergedAt TEXT;"
                : "ALTER TABLE Traitors ADD COLUMN MergedAt DATETIME NULL;");
        await EnsureColumnAsync(db, "Traitors", "BirthPlace",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN BirthPlace TEXT NOT NULL DEFAULT '';"
                : "ALTER TABLE Traitors ADD COLUMN BirthPlace VARCHAR(255) NOT NULL DEFAULT '';");
    }

    /// <summary>检查表是否存在，不存在则执行对应方言的 DDL 文件建表。</summary>
    private static async Task EnsureTableAsync(AppDbContext db, string table, string sqliteDdl, string mysqlDdl)
    {
        bool exists;
        if (db.Database.IsSqlite())
        {
            exists = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name={0}", table)
                .AnyAsync();
        }
        else
        {
            exists = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name={0}", table)
                .AnyAsync();
        }

        if (!exists)
        {
            Log.Information("数据库缺少 {Table} 表，执行增量建表", table);
            var ddlFile = db.Database.IsSqlite() ? sqliteDdl : mysqlDdl;
            var ddlPath = Path.Combine(AppContext.BaseDirectory, "sql", ddlFile);
            var ddl = await File.ReadAllTextAsync(ddlPath);
            await db.Database.ExecuteSqlRawAsync(ddl);
        }
    }

    /// <summary>检查表中是否存在某列，不存在则执行 ALTER TABLE 补列。</summary>
    private static async Task EnsureColumnAsync(AppDbContext db, string table, string column, string alterSql)
    {
        bool exists;
        var conn = db.Database.GetDbConnection();
        await conn.OpenAsync();
        try
        {
            using var cmd = conn.CreateCommand();
            if (db.Database.IsSqlite())
            {
                cmd.CommandText = $"PRAGMA table_info({table})";
                using var reader = await cmd.ExecuteReaderAsync();
                var cols = new List<string>();
                while (await reader.ReadAsync())
                {
                    // PRAGMA table_info 返回：cid, name, type, notnull, dflt_value, pk
                    cols.Add(reader.GetString(1));
                }
                exists = cols.Any(c => c.Equals(column, StringComparison.OrdinalIgnoreCase));
            }
            else
            {
                // MySQL：用 information_schema 检查列是否存在
                cmd.CommandText = "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=@table AND column_name=@col";
                var pTable = cmd.CreateParameter();
                pTable.ParameterName = "@table";
                pTable.Value = table;
                cmd.Parameters.Add(pTable);
                var pCol = cmd.CreateParameter();
                pCol.ParameterName = "@col";
                pCol.Value = column;
                cmd.Parameters.Add(pCol);
                var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                exists = count > 0;
            }
        }
        finally
        {
            await conn.CloseAsync();
        }
        if (!exists)
        {
            Log.Information("数据库表 {Table} 缺少列 {Column}，执行 ALTER TABLE", table, column);
            await db.Database.ExecuteSqlRawAsync(alterSql);
        }
    }
}
