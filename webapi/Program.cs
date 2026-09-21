using System.Text;
using AspNetCoreRateLimit;
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

    // --- HTTPS ---
    // 开发环境：使用 ASP.NET Core 开发证书（首次运行执行 dotnet dev-certs https --trust）
    // 生产环境：在 Https:Certificate 中配置证书文件路径与密码；未配置证书时只监听 HTTP，避免启动崩溃
    var httpsPort = builder.Configuration.GetValue("Https:Port", 3001);
    var httpsCertPath = builder.Configuration["Https:Certificate:Path"];
    var httpsCertPassword = builder.Configuration["Https:Certificate:Password"];
    var hasHttpsCert = !string.IsNullOrWhiteSpace(httpsCertPath) && File.Exists(httpsCertPath);
    var httpsEnabled = httpsPort > 0 && (hasHttpsCert || builder.Environment.IsDevelopment());
    if (httpsEnabled)
    {
        builder.WebHost.ConfigureKestrel(kestrel =>
        {
            kestrel.ListenAnyIP(httpsPort, listen =>
            {
                if (hasHttpsCert)
                    listen.UseHttps(httpsCertPath!, httpsCertPassword);
                else
                    listen.UseHttps(); // 开发证书
            });
        });
    }
    else if (httpsPort > 0)
    {
        Log.Warning("未找到 HTTPS 证书（Https:Certificate:Path={CertPath}），HTTPS 端口 {Port} 不启用，仅监听 HTTP",
            httpsCertPath ?? "(未配置)", httpsPort);
    }

    builder.Services.Configure<DatabaseOptions>(builder.Configuration.GetSection("Database"));
    builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
    builder.Services.Configure<UploadOptions>(builder.Configuration.GetSection("Uploads"));
    builder.Services.Configure<RedisOptions>(builder.Configuration.GetSection("Redis"));
    builder.Services.Configure<DeepSeekOptions>(builder.Configuration.GetSection("DeepSeek"));
    builder.Services.Configure<SecurityOptions>(builder.Configuration.GetSection("Security"));

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
    Console.WriteLine($"Redis:InstanceName={redisOptions.InstanceName}");
    Console.WriteLine($"Redis:DefaultExpireMinutes={redisOptions.DefaultExpireMinutes}");
    if (redisOptions.Enabled)
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            // 单次故障 2s 内可判定，配合熔断器快速降级；AbortOnConnectFail=false 保证 Redis 宕机不影响应用启动
            var config = StackExchange.Redis.ConfigurationOptions.Parse(redisOptions.ConnectionString);
            config.ConnectTimeout = 2000;
            config.SyncTimeout = 2000;
            config.AsyncTimeout = 2000;
            config.ConnectRetry = 2;
            config.AbortOnConnectFail = false;
            options.ConfigurationOptions = config;
            options.InstanceName = redisOptions.InstanceName ?? "";
            // 连接串脱敏（ConfigurationOptions.ToString() 不会掩码密码，需手动处理）
            var masked = System.Text.RegularExpressions.Regex.Replace(
                redisOptions.ConnectionString, @"password=[^,]*", "password=***",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            Log.Information("Redis 缓存已启用：{ConnectionString}", masked);
        });
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
        .AllowAnyMethod()
        .WithExposedHeaders("X-Encrypted")));

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
    // Redis 熔断器（单例，状态跨请求共享；熔断时缓存层自动降级直连 MySQL）
    builder.Services.AddSingleton<RedisCircuitBreaker>();
    // 分布式缓存服务
    builder.Services.AddScoped<CacheService>();
    // 前台访客统计
    builder.Services.AddScoped<VisitService>();
    builder.Services.AddScoped<SystemConfigService>();
    // 后台数据看板
    builder.Services.AddScoped<DashboardService>();
    // AI 史料查询（DeepSeek）
    var deepSeekOptions = builder.Configuration.GetSection("DeepSeek").Get<DeepSeekOptions>() ?? new DeepSeekOptions();
    if (string.IsNullOrWhiteSpace(deepSeekOptions.BaseUrl))
        deepSeekOptions.BaseUrl = "https://api.deepseek.com";
    builder.Services.AddHttpClient("DeepSeek", client =>
    {
        client.BaseAddress = new Uri(deepSeekOptions.BaseUrl.TrimEnd('/') + "/");
        client.Timeout = TimeSpan.FromSeconds(Math.Clamp(deepSeekOptions.TimeoutSeconds, 10, 300));
    });
    builder.Services.AddHttpClient("UploadFetcher", client =>
    {
        client.Timeout = TimeSpan.FromSeconds(60);
    });
    builder.Services.AddScoped<AiService>();
    // 通讯加密服务（AES-GCM/AES-CBC，密钥来自 Security:EncryptionKey）
    builder.Services.AddSingleton<CryptoService>();

    // --- IP 限流（AspNetCoreRateLimit，内存计数器；配合 Nginx 限流做 API 层二次防护） ---
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
    // 超限响应统一为中文 JSON，与全局异常响应格式一致
    builder.Services.PostConfigure<IpRateLimitOptions>(o =>
        o.QuotaExceededResponse = new QuotaExceededResponse
        {
            StatusCode = StatusCodes.Status429TooManyRequests,
            ContentType = "application/json; charset=utf-8",
            // 注意：Content 会被 string.Format 处理，JSON 花括号必须写成 {{ }} 转义
            Content = """{{"message":"请求过于频繁，请稍后再试"}}""",
        });
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

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

    // 异常 → 响应 + 写错误日志；置于最前，保证其后所有中间件（含 Crypto）的异常都被统一兜底
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    // CORS 必须尽早启用：放在 HTTPS 重定向、限流、加密等所有可能短路/重定向的中间件之前，
    // 确保预检 OPTIONS 请求的响应（包括 302 重定向、429 限流等）都带有 CORS 头，
    // 否则浏览器会报 "Redirect is not allowed for a preflight request" 错误。
    app.UseCors("frontend");

    // IP 限流：超限直接 429 短路，放在缓冲/解密之前避免无效请求消耗资源
    app.UseIpRateLimiting();
    // 先启用请求体缓冲（允许审计过滤器和错误中间件重读 body）
    app.UseMiddleware<RequestBodyBufferingMiddleware>();
    // 通讯加密：按 X-Encrypted 头解密请求体、加密 JSON 响应体
    app.UseMiddleware<CryptoMiddleware>();
    // 提取请求级审计上下文（IP/UA/用户信息 + 计时器）
    app.UseMiddleware<AuditEnrichmentMiddleware>();

    // 生产环境启用 HSTS（浏览器强制走 HTTPS）和 HTTP→HTTPS 重定向
    // 开发环境不启用重定向，避免跨域预检请求被 302 重定向导致 CORS 失败
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
        if (httpsEnabled)
        {
            app.UseHttpsRedirection();
        }
    }

    Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "uploads"));
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
            Path.Combine(app.Environment.ContentRootPath, "uploads")),
        RequestPath = "/uploads",
    });

    // Swagger 仅在开发环境暴露，生产环境关闭，避免泄露接口结构与 DTO schema
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

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

        // 补齐 VisitLogs 表的新增列（Path：真实 PV 需要按页面统计）
        await EnsureColumnAsync(db, "VisitLogs", "Path",
            db.Database.IsSqlite()
                ? "ALTER TABLE VisitLogs ADD COLUMN Path TEXT NOT NULL DEFAULT '';"
                : "ALTER TABLE VisitLogs ADD COLUMN Path VARCHAR(256) NOT NULL DEFAULT '';");

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

        // 补齐 Traitors 表的新增列（IsHidden / HiddenReason / HiddenAt / HiddenBy：档案快速下架，应对内容投诉）
        await EnsureColumnAsync(db, "Traitors", "IsHidden",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN IsHidden INTEGER NOT NULL DEFAULT 0;"
                : "ALTER TABLE Traitors ADD COLUMN IsHidden TINYINT(1) NOT NULL DEFAULT 0;");
        await EnsureColumnAsync(db, "Traitors", "HiddenReason",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN HiddenReason TEXT;"
                : "ALTER TABLE Traitors ADD COLUMN HiddenReason VARCHAR(512) NULL;");
        await EnsureColumnAsync(db, "Traitors", "HiddenAt",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN HiddenAt TEXT;"
                : "ALTER TABLE Traitors ADD COLUMN HiddenAt DATETIME NULL;");
        await EnsureColumnAsync(db, "Traitors", "HiddenBy",
            db.Database.IsSqlite()
                ? "ALTER TABLE Traitors ADD COLUMN HiddenBy TEXT;"
                : "ALTER TABLE Traitors ADD COLUMN HiddenBy VARCHAR(64) NULL;");

        // 补齐 Users 表的新增列（AvatarUrl：用户头像）
        await EnsureColumnAsync(db, "Users", "AvatarUrl",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN AvatarUrl TEXT;"
                : "ALTER TABLE Users ADD COLUMN AvatarUrl VARCHAR(512) NULL;");

        // 补齐 Users 表的新增列（个人资料：性别/生日/地址/手机号）
        await EnsureColumnAsync(db, "Users", "Gender",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Gender TEXT;"
                : "ALTER TABLE Users ADD COLUMN Gender VARCHAR(16) NULL;");
        await EnsureColumnAsync(db, "Users", "Birthday",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Birthday TEXT;"
                : "ALTER TABLE Users ADD COLUMN Birthday VARCHAR(10) NULL;");
        await EnsureColumnAsync(db, "Users", "Address",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Address TEXT;"
                : "ALTER TABLE Users ADD COLUMN Address VARCHAR(255) NULL;");
        await EnsureColumnAsync(db, "Users", "Phone",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Phone TEXT;"
                : "ALTER TABLE Users ADD COLUMN Phone VARCHAR(32) NULL;");
        await EnsureColumnAsync(db, "Users", "Nickname",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Nickname TEXT;"
                : "ALTER TABLE Users ADD COLUMN Nickname VARCHAR(64) NULL;");
        await EnsureColumnAsync(db, "Users", "Signature",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Signature TEXT;"
                : "ALTER TABLE Users ADD COLUMN Signature VARCHAR(255) NULL;");
        await EnsureColumnAsync(db, "Users", "Region",
            db.Database.IsSqlite()
                ? "ALTER TABLE Users ADD COLUMN Region TEXT;"
                : "ALTER TABLE Users ADD COLUMN Region VARCHAR(64) NULL;");

        // 站内通知表（EnsureCreated 会为新库自动建表，此处兼容旧库）
        await db.Database.ExecuteSqlRawAsync(
            db.Database.IsSqlite()
                ? """CREATE TABLE IF NOT EXISTS "Notifications" ("Id" TEXT NOT NULL PRIMARY KEY, "UserId" TEXT NOT NULL, "Type" TEXT NOT NULL DEFAULT '', "ReferenceName" TEXT NOT NULL DEFAULT '', "Comment" TEXT, "RevisionId" TEXT, "IsRead" INTEGER NOT NULL DEFAULT 0, "CreatedAt" TEXT NOT NULL); CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications" ("UserId"); CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");"""
                : "CREATE TABLE IF NOT EXISTS `Notifications` (`Id` VARCHAR(64) NOT NULL PRIMARY KEY, `UserId` VARCHAR(64) NOT NULL, `Type` VARCHAR(64) NOT NULL DEFAULT '', `ReferenceName` VARCHAR(255) NOT NULL DEFAULT '', `Comment` TEXT, `RevisionId` VARCHAR(64) NULL, `IsRead` TINYINT(1) NOT NULL DEFAULT 0, `CreatedAt` DATETIME NOT NULL, INDEX `IX_Notifications_UserId` (`UserId`), INDEX `IX_Notifications_CreatedAt` (`CreatedAt`));");

        // 系统配置表（EnsureCreated 会为新库自动建表，此处兼容旧库）
        await db.Database.ExecuteSqlRawAsync(
            db.Database.IsSqlite()
                ? """CREATE TABLE IF NOT EXISTS "SystemConfigs" ("Id" TEXT NOT NULL PRIMARY KEY, "Key" TEXT NOT NULL, "Value" TEXT NOT NULL DEFAULT '', "Category" TEXT NOT NULL DEFAULT '', "Description" TEXT, "CreatedAt" TEXT NOT NULL, "UpdatedAt" TEXT); CREATE UNIQUE INDEX IF NOT EXISTS "IX_SystemConfigs_Key" ON "SystemConfigs" ("Key"); CREATE INDEX IF NOT EXISTS "IX_SystemConfigs_Category" ON "SystemConfigs" ("Category");"""
                : "CREATE TABLE IF NOT EXISTS `SystemConfigs` (`Id` VARCHAR(64) NOT NULL PRIMARY KEY, `Key` VARCHAR(128) NOT NULL, `Value` TEXT NOT NULL, `Category` VARCHAR(64) NOT NULL, `Description` TEXT, `CreatedAt` DATETIME NOT NULL, `UpdatedAt` DATETIME NULL, UNIQUE INDEX `IX_SystemConfigs_Key` (`Key`), INDEX `IX_SystemConfigs_Category` (`Category`));");

        // 档案列表排序索引：公开列表按 (HarmLevel asc, CreatedAt desc, Id) 排序并支持 Keyset 游标分页，
        // InnoDB 二级索引叶子自带主键 Id，该复合索引等效覆盖全部三个排序列
        await EnsureIndexAsync(db, "Traitors", "IX_Traitors_HarmLevel_CreatedAt",
            db.Database.IsSqlite()
                ? """CREATE INDEX "IX_Traitors_HarmLevel_CreatedAt" ON "Traitors" ("HarmLevel", "CreatedAt");"""
                : "CREATE INDEX `IX_Traitors_HarmLevel_CreatedAt` ON `Traitors` (`HarmLevel`, `CreatedAt`);");

        // 前台联系留言表（EnsureCreated 会为新库自动建表，此处兼容旧库）
        await db.Database.ExecuteSqlRawAsync(
            db.Database.IsSqlite()
                ? """CREATE TABLE IF NOT EXISTS "ContactMessages" ("Id" TEXT NOT NULL PRIMARY KEY, "Title" TEXT NOT NULL, "Content" TEXT NOT NULL, "Name" TEXT NOT NULL, "Contact" TEXT NOT NULL, "Ip" TEXT, "IsHandled" INTEGER NOT NULL DEFAULT 0, "CreatedAt" TEXT NOT NULL, "HandledAt" TEXT); CREATE INDEX IF NOT EXISTS "IX_ContactMessages_CreatedAt" ON "ContactMessages" ("CreatedAt"); CREATE INDEX IF NOT EXISTS "IX_ContactMessages_IsHandled" ON "ContactMessages" ("IsHandled");"""
                : "CREATE TABLE IF NOT EXISTS `ContactMessages` (`Id` VARCHAR(64) NOT NULL PRIMARY KEY, `Title` VARCHAR(200) NOT NULL, `Content` TEXT NOT NULL, `Name` VARCHAR(64) NOT NULL, `Contact` VARCHAR(200) NOT NULL, `Ip` VARCHAR(64) NULL, `IsHandled` TINYINT(1) NOT NULL DEFAULT 0, `CreatedAt` DATETIME NOT NULL, `HandledAt` DATETIME NULL, INDEX `IX_ContactMessages_CreatedAt` (`CreatedAt`), INDEX `IX_ContactMessages_IsHandled` (`IsHandled`));");
    }

    /// <summary>检查表是否存在，不存在则执行对应方言的 DDL 文件建表。</summary>
    private static async Task EnsureTableAsync(AppDbContext db, string table, string sqliteDdl, string mysqlDdl)
    {
        // 注意：COUNT(*) 恒返回一行，必须取值判断，不能用 AnyAsync（恒为 true）；
        // 且 EF 标量 SqlQuery 要求列别名为 Value
        int count;
        if (db.Database.IsSqlite())
        {
            count = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM sqlite_master WHERE type='table' AND name={0}", table)
                .SingleAsync();
        }
        else
        {
            count = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name={0}", table)
                .SingleAsync();
        }

        if (count == 0)
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

    /// <summary>检查索引是否存在，不存在则执行 CREATE INDEX（MySQL 不支持 CREATE INDEX IF NOT EXISTS，需先查元数据）。</summary>
    private static async Task EnsureIndexAsync(AppDbContext db, string table, string index, string createSql)
    {
        int count;
        if (db.Database.IsSqlite())
        {
            count = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM sqlite_master WHERE type='index' AND name={0}", index)
                .SingleAsync();
        }
        else
        {
            count = await db.Database
                .SqlQueryRaw<int>("SELECT COUNT(*) AS Value FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = {0} AND index_name = {1}", table, index)
                .SingleAsync();
        }

        if (count == 0)
        {
            Log.Information("数据库表 {Table} 缺少索引 {Index}，执行 CREATE INDEX", table, index);
            await db.Database.ExecuteSqlRawAsync(createSql);
        }
    }
}
