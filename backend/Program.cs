
using backend.Data;
using backend.Endpoints;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Prevent circular references when serializing EF Core entities.
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler =
        ReferenceHandler.IgnoreCycles;
});

// Allow the local Vite development server to access the API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Connect EF Core to PostgreSQL using the configured connection string.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    );
});

builder.Services.AddScoped<SkillService>();
builder.Services.AddHttpClient<JobExtractionService>();

var app = builder.Build();

app.UseCors("Frontend");

// Serve the React build output from wwwroot.
app.UseDefaultFiles();
app.UseStaticFiles();

// Register API endpoints before the React fallback.
app.MapApplicationEndpoints();
app.MapUserSkillEndpoints();
app.MapSkillEndpoints();
app.MapStatisticsEndpoints();
app.MapJobExtractionEndpoints();

// Let React handle frontend routes, but not missing API routes.
app.MapFallbackToFile("index.html");

app.Run();
