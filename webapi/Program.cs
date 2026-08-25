using System.Text;
using HanJianNet.WebApi.Data;
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

    var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
    builder.Services.AddCors(o => o.AddPolicy("frontend", p => p
        .WithOrigins(corsOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod()));

    builder.Services.AddScoped<AuthService>();
    builder.Services.AddScoped<UserService>();
    builder.Services.AddScoped<RoleService>();
    builder.Services.AddScoped<MenuService>();
    builder.Services.AddScoped<TraitorService>();
    builder.Services.AddScoped<RevisionService>();
    builder.Services.AddScoped<UploadService>();

    builder.Services.AddControllers()
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
            Description = "HanJianNet 后端接口文档",
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
