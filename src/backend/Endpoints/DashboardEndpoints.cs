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
                    productName = g.Key.Name,
                    revenue = g.Sum(u => u.BillingAmount)
                })
                .OrderBy(r => r.yearMonth)
                .ThenBy(r => r.productName)
                .ToListAsync();

            var response = new
            {
                months = revenue
                    .GroupBy(r => r.yearMonth)
                    .Select(g => new
                    {
                        yearMonth = g.Key,
                        totalRevenue = g.Sum(x => x.revenue),
                        byProduct = g.Select(x => new
                        {
                            x.productName,
                            x.revenue
                        }).ToList()
                    })
                    .OrderBy(r => r.yearMonth)
                    .ToList()
            };

            return Results.Ok(response);
        }).WithName("GetDashboardRevenue");

        group.MapGet("/customers", async (AppDbContext db) =>
        {
            var customers = await db.Customers
                .AsNoTracking()
                .Select(c => new
                {
                    customerId = c.Id,
                    customerName = c.Name,
                    contractCount = c.Contracts.Count(ct => ct.Status == ContractStatus.Active),
                    monthlyTotals = c.Contracts
                        .Where(ct => ct.Status == ContractStatus.Active)
                        .SelectMany(ct => ct.MonthlyUsages)
                        .GroupBy(u => u.YearMonth)
                        .Select(g => new
                        {
                            yearMonth = g.Key,
                            total = g.Sum(u => u.BillingAmount)
                        })
                        .OrderByDescending(g => g.yearMonth)
                        .Take(2)
                        .ToList()
                })
                .ToListAsync();

            var response = customers
                .Select(c =>
                {
                    var latestMonthlyTotal = c.monthlyTotals.FirstOrDefault()?.total ?? 0m;
                    var previousMonthlyTotal = c.monthlyTotals.Skip(1).FirstOrDefault()?.total ?? latestMonthlyTotal;
                    var trend = latestMonthlyTotal.CompareTo(previousMonthlyTotal) switch
                    {
                        > 0 => "increasing",
                        < 0 => "decreasing",
                        _ => "stable"
                    };

                    return new
                    {
                        c.customerId,
                        c.customerName,
                        c.contractCount,
                        latestMonthlyTotal,
                        trend
                    };
                })
                .OrderByDescending(c => c.latestMonthlyTotal)
                .ThenBy(c => c.customerName)
                .ToList();

            return Results.Ok(response);
        }).WithName("GetDashboardCustomers");

        group.MapGet("/trials", async (AppDbContext db) =>
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var sevenDaysLater = today.AddDays(7);
            var startOfThisMonth = new DateOnly(today.Year, today.Month, 1);
            var startOfNextMonth = startOfThisMonth.AddMonths(1);

            var activeTrials = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Active);

            var convertedThisMonth = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Converted &&
                                 t.UpdatedAt >= startOfThisMonth.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc) &&
                                 t.UpdatedAt < startOfNextMonth.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));

            var expiredThisMonth = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Expired &&
                                 t.UpdatedAt >= startOfThisMonth.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc) &&
                                 t.UpdatedAt < startOfNextMonth.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));

            var convertedTotal = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Converted);
            var expiredTotal = await db.Trials
                .CountAsync(t => t.Status == TrialStatus.Expired);

            var totalCompleted = convertedTotal + expiredTotal;

            var conversionRate = totalCompleted > 0
                ? Math.Round((double)convertedTotal / totalCompleted, 4)
                : 0.0;

            var expiringWithin7Days = await db.Trials
                .AsNoTracking()
                .Where(t => t.Status == TrialStatus.Active &&
                            t.EndDate >= today &&
                            t.EndDate <= sevenDaysLater)
                .OrderBy(t => t.EndDate)
                .Select(t => new
                {
                    customerName = t.Customer.Name,
                    productName = t.Product.Name,
                    remainingDays = t.EndDate.DayNumber - today.DayNumber,
                    usageLevel = "medium"
                })
                .ToListAsync();

            return Results.Ok(new
            {
                activeTrials,
                convertedThisMonth,
                expiredThisMonth,
                conversionRate,
                expiringWithin7Days
            });
        }).WithName("GetDashboardTrials");

        return group;
    }
}
