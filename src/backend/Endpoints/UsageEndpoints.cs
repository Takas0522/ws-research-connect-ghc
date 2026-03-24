using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class UsageEndpoints
{
    public static RouteGroupBuilder MapUsageEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/usages");

        group.MapGet("/", async (
            Guid? contractId,
            Guid? customerId,
            Guid? productId,
            string? from,
            string? to,
            AppDbContext db) =>
        {
            var query = db.MonthlyUsages
                .AsNoTracking()
                .Include(u => u.Contract)
                    .ThenInclude(c => c.Customer)
                .Include(u => u.Contract)
                    .ThenInclude(c => c.Product)
                .Include(u => u.Contract)
                    .ThenInclude(c => c.Plan)
                .AsQueryable();

            if (contractId is not null)
                query = query.Where(u => u.ContractId == contractId.Value);
            if (customerId is not null)
                query = query.Where(u => u.Contract.CustomerId == customerId.Value);
            if (productId is not null)
                query = query.Where(u => u.Contract.ProductId == productId.Value);
            if (from is not null)
                query = query.Where(u => string.Compare(u.YearMonth, from) >= 0);
            if (to is not null)
                query = query.Where(u => string.Compare(u.YearMonth, to) <= 0);

            var usages = await query
                .OrderByDescending(u => u.YearMonth)
                .Select(u => new
                {
                    u.Id,
                    u.ContractId,
                    customerName = u.Contract.Customer.Name,
                    productName = u.Contract.Product.Name,
                    planName = u.Contract.Plan.Name,
                    u.YearMonth,
                    u.UsageQuantity,
                    u.BillingAmount,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .ToListAsync();

            return Results.Ok(usages);
        }).WithName("GetUsages");

        group.MapPost("/", async (RegisterUsageRequest req, AppDbContext db, BillingService billing) =>
        {
            var contract = await db.Contracts
                .Include(c => c.Plan)
                .FirstOrDefaultAsync(c => c.Id == req.ContractId);

            if (contract is null)
                return Results.NotFound(new { message = "Contract not found." });

            // Check if there's an active trial for the same customer+product
            var isTrial = await db.Trials.AnyAsync(t =>
                t.CustomerId == contract.CustomerId &&
                t.ProductId == contract.ProductId &&
                t.Status == TrialStatus.Active);

            var billingAmount = billing.Calculate(contract.Plan, contract.ContractType, req.UsageQuantity, isTrial);

            var existing = await db.MonthlyUsages
                .FirstOrDefaultAsync(u => u.ContractId == req.ContractId && u.YearMonth == req.YearMonth);

            if (existing is not null)
            {
                existing.UsageQuantity = req.UsageQuantity;
                existing.BillingAmount = billingAmount;
            }
            else
            {
                existing = new MonthlyUsage
                {
                    ContractId = req.ContractId,
                    YearMonth = req.YearMonth,
                    UsageQuantity = req.UsageQuantity,
                    BillingAmount = billingAmount
                };
                db.MonthlyUsages.Add(existing);
            }

            await db.SaveChangesAsync();
            return Results.Ok(new
            {
                existing.Id,
                existing.ContractId,
                existing.YearMonth,
                existing.UsageQuantity,
                existing.BillingAmount
            });
        }).WithName("RegisterUsage");

        group.MapPost("/bulk", async (BulkUsageRequest req, AppDbContext db, BillingService billing) =>
        {
            var results = new List<object>();

            foreach (var item in req.Usages)
            {
                var contract = await db.Contracts
                    .Include(c => c.Plan)
                    .FirstOrDefaultAsync(c => c.Id == item.ContractId);

                if (contract is null)
                {
                    results.Add(new { item.ContractId, item.YearMonth, error = "Contract not found." });
                    continue;
                }

                var isTrial = await db.Trials.AnyAsync(t =>
                    t.CustomerId == contract.CustomerId &&
                    t.ProductId == contract.ProductId &&
                    t.Status == TrialStatus.Active);

                var billingAmount = billing.Calculate(contract.Plan, contract.ContractType, item.UsageQuantity, isTrial);

                var existing = await db.MonthlyUsages
                    .FirstOrDefaultAsync(u => u.ContractId == item.ContractId && u.YearMonth == item.YearMonth);

                if (existing is not null)
                {
                    existing.UsageQuantity = item.UsageQuantity;
                    existing.BillingAmount = billingAmount;
                }
                else
                {
                    existing = new MonthlyUsage
                    {
                        ContractId = item.ContractId,
                        YearMonth = item.YearMonth,
                        UsageQuantity = item.UsageQuantity,
                        BillingAmount = billingAmount
                    };
                    db.MonthlyUsages.Add(existing);
                }

                results.Add(new
                {
                    existing.Id,
                    existing.ContractId,
                    existing.YearMonth,
                    existing.UsageQuantity,
                    existing.BillingAmount
                });
            }

            await db.SaveChangesAsync();
            return Results.Ok(results);
        }).WithName("BulkRegisterUsage");

        return group;
    }
}

public record RegisterUsageRequest(
    Guid ContractId,
    string YearMonth,
    decimal UsageQuantity
);

public record BulkUsageRequest(
    List<RegisterUsageRequest> Usages
);
