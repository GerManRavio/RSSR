using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Service.Api.Data.Entities;

public class Todo
{
    public int Id { get; init; }
    public string Title { get; set; } = string.Empty;
    public bool IsDone { get; set; }
}

public class Configuration : IEntityTypeConfiguration<Todo>
{
    public void Configure(EntityTypeBuilder<Todo> builder)
    {
        builder.ToTable("Todos");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).ValueGeneratedOnAdd();
        builder.Property(t => t.Title).IsRequired().HasMaxLength(255);
        builder.Property(t => t.IsDone).IsRequired();
    }
}