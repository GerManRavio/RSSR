using Microsoft.EntityFrameworkCore;
using Service.Api.Data.Entities;

namespace Service.Api;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Todo> Todos => Set<Todo>();

    // protected override void OnConfiguring(DbContextOptionsBuilder builder)
    // {
    //     builder.EnableSensitiveDataLogging();
    //     builder.EnableDetailedErrors();
    //     base.OnConfiguring(builder);
    // }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}