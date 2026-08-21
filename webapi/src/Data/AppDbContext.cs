using HanJianNet.WebApi.Entities;
using Microsoft.EntityFrameworkCore;

namespace HanJianNet.WebApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Traitor> Traitors => Set<Traitor>();
    public DbSet<Revision> Revisions => Set<Revision>();
    public DbSet<Spouse> Spouses => Set<Spouse>();
    public DbSet<Child> Children => Set<Child>();
    public DbSet<Residence> Residences => Set<Residence>();
    public DbSet<CrimeRecord> CrimeRecords => Set<CrimeRecord>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<SourceRef> Sources => Set<SourceRef>();
    public DbSet<LifeEvent> LifeEvents => Set<LifeEvent>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<AppRole> Roles => Set<AppRole>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Username).IsUnique();
            e.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<MenuItem>(e =>
        {
            e.HasIndex(m => m.Key).IsUnique();
            e.HasIndex(m => m.Path).IsUnique();
            e.HasIndex(m => m.Parent);
        });

        modelBuilder.Entity<AppRole>(e =>
        {
            e.HasIndex(r => r.Key).IsUnique();
        });

        modelBuilder.Entity<Permission>(e =>
        {
            e.HasIndex(p => p.Key).IsUnique();
        });

        modelBuilder.Entity<RolePermission>(e =>
        {
            e.HasIndex(rp => new { rp.RoleKey, rp.MenuKey }).IsUnique();
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
    }
}
