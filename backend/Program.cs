using backend.Data;
using backend.Endpoints;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;


// 创建 ASP.NET Core 应用
var builder = WebApplication.CreateBuilder(args);


// 防止 EF Core navigation properties
// 在 JSON serialization 时形成 object cycle
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.ReferenceHandler =
        ReferenceHandler.IgnoreCycles;
});

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

// 注册 AppDbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection"
        )
    );
});


// 注册业务 Service
builder.Services.AddScoped<SkillService>();
builder.Services.AddHttpClient<JobExtractionService>();


var app = builder.Build();
app.UseCors("Frontend");


// 注册各组 API
app.MapApplicationEndpoints();
app.MapUserSkillEndpoints();
app.MapSkillEndpoints();
app.MapStatisticsEndpoints();
app.MapJobExtractionEndpoints();

// 启动服务器
app.Run();