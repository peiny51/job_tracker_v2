using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<AppUser> AppUsers { get; set; }

    public DbSet<Skill> Skills { get; set; }

    public DbSet<SkillAlias> SkillAliases { get; set; }

    public DbSet<UserSkill> UserSkills { get; set; }

    public DbSet<JobApplication> JobApplications { get; set; }

    public DbSet<JobApplicationSkill> JobApplicationSkills { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Relationships and constraints will go here.
        modelBuilder.Entity<SkillAlias>()
        .HasOne(sa => sa.Skill) //对于一个 SkillAlias，它有一个 Skill
        .WithMany(s => s.Aliases) //一个 Skill 有很多 SkillAliases。
        .HasForeignKey(sa => sa.SkillId) //它们之间的 Foreign Key 是 SkillAlias.SkillId。
        .OnDelete(DeleteBehavior.Cascade);

        // 配置 user <-> skill 关系
        //AppUser 1 <── many UserSkill
        // skill 1 <── many UserSkill
        modelBuilder.Entity<UserSkill>() //一个 UserSkill只有一个 User
        .HasOne(us => us.User)
        .WithMany(u => u.UserSkills)
        .HasForeignKey(us => us.UserId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserSkill>()
        .HasOne(us => us.Skill)
        .WithMany(s => s.UserSkills)
        .HasForeignKey(us => us.SkillId)
        .OnDelete(DeleteBehavior.Restrict);

        // 配置 AppUser → JobApplication
        modelBuilder.Entity<JobApplication>()
        .HasOne(j => j.User)
        .WithMany(u => u.JobApplications)
        .HasForeignKey(j => j.UserId)
        .OnDelete(DeleteBehavior.Cascade);

        // 配置 Job ↔ Skill
        modelBuilder.Entity<JobApplicationSkill>()
        .HasOne(js => js.JobApplication)
        .WithMany(j => j.JobApplicationSkills) // 一个 JobApplication 可以对应很多条 JobApplicationSkill。
        .HasForeignKey(js => js.JobApplicationId)
        .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<JobApplicationSkill>()
        .HasOne(js => js.Skill)
        .WithMany(s => s.JobApplicationSkills)
        .HasForeignKey(js => js.SkillId)
        .OnDelete(DeleteBehavior.Restrict);


        // -----------------------------
        // Unique constraints
        // -----------------------------

        // dont want user1 python duplicate
        modelBuilder.Entity<UserSkill>()
        .HasIndex(us => new { us.UserId, us.SkillId })
        .IsUnique();

        //不允许重复的 JobApplicationId + SkillId 组合
        modelBuilder.Entity<JobApplicationSkill>()
        .HasIndex(js => new { js.JobApplicationId, js.SkillId })
        .IsUnique();
        
        // 已经有js → JavaScript 就不允许 js → JavaScript js → JavaScript 或者 js → Java
        modelBuilder.Entity<SkillAlias>()
        .HasIndex(sa => sa.Alias)
        .IsUnique();

        // Skill Name 也应该唯一
        modelBuilder.Entity<Skill>()
        .HasIndex(s => s.Name)
        .IsUnique();
    }
}