using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<WebMenu> WebMenus => Set<WebMenu>();
    public DbSet<Traitor> Traitors => Set<Traitor>();
    public DbSet<Spouse> Spouses => Set<Spouse>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<Residence> Residences => Set<Residence>();
    public DbSet<CrimeRecord> CrimeRecords => Set<CrimeRecord>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<SourceRef> Sources => Set<SourceRef>();
    public DbSet<LifeEvent> LifeEvents => Set<LifeEvent>();
    public DbSet<Revision> Revisions => Set<Revision>();
    public DbSet<LoginLog> LoginLogs => Set<LoginLog>();
    public DbSet<OperationLog> OperationLogs => Set<OperationLog>();
    public DbSet<QueryLog> QueryLogs => Set<QueryLog>();
    public DbSet<ErrorLog> ErrorLogs => Set<ErrorLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Role>(e =>
        {
            e.HasIndex(r => r.Key).IsUnique();
            e.HasIndex(r => r.Sort);
        });

        modelBuilder.Entity<Permission>(e =>
        {
            e.HasIndex(p => p.Key).IsUnique();
        });

        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasIndex(rp => new { rp.RoleKey, rp.PermissionKey }).IsUnique();
            e.HasIndex(rp => rp.RoleKey);
            e.HasIndex(rp => rp.PermissionKey);
        });

        modelBuilder.Entity<MenuItem>(e =>
        {
            e.HasIndex(m => m.Key).IsUnique();
            e.HasIndex(m => m.Path).IsUnique();
            e.HasIndex(m => m.Parent);
            e.HasIndex(m => m.Sort);
        });

        modelBuilder.Entity<WebMenu>(e =>
        {
            e.HasIndex(m => m.Key).IsUnique();
            e.HasIndex(m => m.Path).IsUnique();
            e.HasIndex(m => m.Sort);
            e.HasIndex(m => m.IsEnabled);
        });

        modelBuilder.Entity<Spouse>()
            .HasOne(s => s.Traitor).WithMany(t => t.Spouses)
            .HasForeignKey(s => s.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Child>()
            .HasOne(c => c.Traitor).WithMany(t => t.Children)
            .HasForeignKey(c => c.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Residence>()
            .HasOne(r => r.Traitor).WithMany(t => t.Residences)
            .HasForeignKey(r => r.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CrimeRecord>()
            .HasOne(c => c.Traitor).WithMany(t => t.CrimeRecords)
            .HasForeignKey(c => c.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Attachment>()
            .HasOne(a => a.Traitor).WithMany(t => t.Attachments)
            .HasForeignKey(a => a.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SourceRef>()
            .HasOne(s => s.Traitor).WithMany(t => t.Sources)
            .HasForeignKey(s => s.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<LifeEvent>()
            .HasOne(l => l.Traitor).WithMany(t => t.LifeEvents)
            .HasForeignKey(l => l.TraitorId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Revision>()
            .HasOne(r => r.Traitor).WithMany(t => t.Revisions)
            .HasForeignKey(r => r.TraitorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Revision>()
            .HasOne(r => r.Submitter).WithMany()
            .HasForeignKey(r => r.SubmitterId).OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Revision>()
            .HasOne(r => r.Reviewer).WithMany()
            .HasForeignKey(r => r.ReviewerId).OnDelete(DeleteBehavior.Restrict);

        // ---------- 4 类系统日志：按创建时间/用户建索引，日志不与主业务表级联，避免删除主数据时丢审计链 ----------
        modelBuilder.Entity<LoginLog>(e =>
        {
            e.HasIndex(l => l.CreatedAt);
            e.HasIndex(l => l.UserId);
            e.HasIndex(l => l.Username);
            e.HasIndex(l => l.Status);
            e.HasIndex(l => l.Action);
            e.HasIndex(l => l.Ip);
        });
        modelBuilder.Entity<OperationLog>(e =>
        {
            e.HasIndex(o => o.CreatedAt);
            e.HasIndex(o => o.UserId);
            e.HasIndex(o => o.Module);
            e.HasIndex(o => o.Action);
            e.HasIndex(o => o.StatusCode);
            e.HasIndex(o => o.TargetId);
        });
        modelBuilder.Entity<QueryLog>(e =>
        {
            e.HasIndex(q => q.CreatedAt);
            e.HasIndex(q => q.UserId);
            e.HasIndex(q => q.Module);
            e.HasIndex(q => q.StatusCode);
            e.HasIndex(q => q.Path);
        });
        modelBuilder.Entity<ErrorLog>(e =>
        {
            e.HasIndex(er => er.CreatedAt);
            e.HasIndex(er => er.UserId);
            e.HasIndex(er => er.Level);
            e.HasIndex(er => er.StatusCode);
            e.HasIndex(er => er.Path);
            e.HasIndex(er => er.ExceptionType);
        });
    }
}
