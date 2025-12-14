using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Service.Api;
using Service.Api.Data.Entities;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddDbContextFactory<AppDbContext>(opt => 
    opt.UseNpgsql(builder.Configuration.GetConnectionString("db")));

builder.Services.AddOpenApi();

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Apply migrations automatically on startup (for dev/demo)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// Minimal API Endpoints
app.MapGet("/api/todos", async (AppDbContext db) => await db.Todos.AsNoTracking().ToListAsync());

app.MapGet("/api/todos/{id:int}", async (int id, AppDbContext db) =>
    await db.Todos.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id)
        is { } todo ? Results.Ok(todo) : Results.NotFound());

app.MapPost("/api/todos", async (Todo input, AppDbContext db) =>
{
    db.Todos.Add(input);
    await db.SaveChangesAsync();
    return Results.Created($"/api/todos/{input.Id}", input);
});

app.MapPut("/api/todos/{id:int}", async (int id, Todo update, AppDbContext db) =>
{
    var todo = await db.Todos.FirstOrDefaultAsync(t => t.Id == id);
    if (todo is null) return Results.NotFound();
    todo.Title = update.Title;
    todo.IsDone = update.IsDone;
    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapDelete("/api/todos/{id:int}", async (int id, AppDbContext db) =>
{
    var todo = await db.Todos.FirstOrDefaultAsync(t => t.Id == id);
    if (todo is null) return Results.NotFound();
    db.Todos.Remove(todo);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

await app.RunAsync();