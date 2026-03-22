using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/dashboard");

        group.MapGet("/revenue", async (string? from, string? to, AppDbContext db) =>
        {
            var query = db.MonthlyUsages
                .AsNoTracking()
                .Include(u => u.Contract)
                    .ThenInclude(c => c.Product)
                .AsQueryable();

            if (from is not null)
                query = query.Where(u => string.Compare(u.YearMonth, from) >= 0);
            if (to is not null)
                query = query.Where(u => string.Compare(u.YearMonth, to) <= 0);

            var revenue = await query
                .GroupBy(u => new { u.YearMonth, u.Contract.ProductId, u.Contract.Product.Name })
                .Select(g => new
                {
                    yearMonth = g.Key.YearMonth,
                    productId = g.Key.ProductId,
                    productName = g.Key.Name,
                    totalRevenue = g.Sum(u => u.BillingAmount),
                    contractCount = g.Select(u => u.ContractId).Distinct().Count()
                })
                .OrderBy(r => r.yearMonth)
                .ThenBy(r => r.productName)
                .ToListAsync();

            return Results.Ok(revenue);
        }).WithName("GetDashboardRevenue");

        group.MapGet("/customers", async (AppDbContext db) =>
        {
            var totalCustomers = await db.Customers.CountAsync();
            var activeCustomers = await db.Customers
                .CountAsync(c => c.Contracts.Any(ct => ct.Status == ContractStatus.Active));

            var now = DateTime.UtcNow;
            var startOfThisMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var startOfNextMonth = startOfThisMonth.AddMonths(1);
            var startOfLastMonth = startOfThisMonth.AddMonths(-1);

            var newCustomersThisMonth = await db.Customers
                .CountAsync(c => c.CreatedAt >= startOfThisMonth && c.CreatedAt < startOfNextMonth);

            var newCustomersLastMonth = await db.Customers
                .CountAsync(c => c.CreatedAt >= startOfLastMonth && c.CreatedAt < startOfThisMonth);

            var trend = newCustomersLastMonth > 0
                ? Math.Round((double)(newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth * 100, 1)
                : newCustomersThisMonth > 0 ? 100.0 : 0.0;

            return Results.Ok(new
            {
                totalCustomers,
                activeCustomers,
                newCustomersThisMonth,
                newCustomersLastMonth,
                trend
            });
        }).WithName("GetDashboardCustomers");

        group.MapGet("/trials", async (AppDbContext db) =>
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var sevenDaysLater = today.AddDays(7);

            var activeTrials = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Active);

            var totalCompleted = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Converted || t.Status == TrialStatus.Expired);
            var converted = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Converted);

            var conversionRate = totalCompleted > 0
                ? Math.Round((double)converted / totalCompleted * 100, 1)
                : 0.0;

            var expiringWithin7Days = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Active &&
                                 t.EndDate >= today &&
                                 t.EndDate <= sevenDaysLater);

            return Results.Ok(new
            {
                activeTrials,
                conversionRate,
                expiringWithin7Days
            });
        }).WithName("GetDashboardTrials");

        return group;
    }
}
