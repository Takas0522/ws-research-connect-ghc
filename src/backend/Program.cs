using System.Text.Json;
using System.Text.Json.Serialization;
using Backend.Data;
using Backend.Endpoints;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// PostgreSQL via EF Core — MapEnum inside UseNpgsql configures both EF and Npgsql layers (EF 9+)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is not configured.");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, o =>
    {
        o.MapEnum<ProductStatus>("product_status");
        o.MapEnum<ContractType>("contract_type");
        o.MapEnum<ContractStatus>("contract_status");
        o.MapEnum<ContractChangeType>("contract_change_type");
        o.MapEnum<TrialRestriction>("trial_restriction");
        o.MapEnum<TrialStatus>("trial_status");
    }));

builder.Services.AddScoped<BillingService>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(
        new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseLower));
});

builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// CORS — allow frontend dev server
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173", "http://0.0.0.0:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

app.MapHealthChecks("/healthz");

// Map all endpoint groups
app.MapProductEndpoints();
app.MapPlanEndpoints();
app.MapCustomerEndpoints();
app.MapContractEndpoints();
app.MapUsageEndpoints();
app.MapTrialEndpoints();
app.MapDashboardEndpoints();

app.Run();

// WebApplicationFactory からアクセスするためのマーカー
public partial class Program { }
