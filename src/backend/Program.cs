using Backend.Data;
using Backend.Endpoints;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Npgsql enum mapping
var dataSourceBuilder = new NpgsqlDataSourceBuilder(
    builder.Configuration.GetConnectionString("DefaultConnection"));
dataSourceBuilder.MapEnum<ProductStatus>("product_status");
dataSourceBuilder.MapEnum<ContractType>("contract_type");
dataSourceBuilder.MapEnum<ContractStatus>("contract_status");
dataSourceBuilder.MapEnum<ContractChangeType>("contract_change_type");
dataSourceBuilder.MapEnum<TrialRestriction>("trial_restriction");
dataSourceBuilder.MapEnum<TrialStatus>("trial_status");
var dataSource = dataSourceBuilder.Build();

// PostgreSQL via EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(dataSource));

builder.Services.AddScoped<BillingService>();

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
