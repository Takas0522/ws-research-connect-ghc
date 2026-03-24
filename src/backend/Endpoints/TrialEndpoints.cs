using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class TrialEndpoints
{
    public static RouteGroupBuilder MapTrialEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/trials");

        group.MapGet("/", async (TrialStatus? status, Guid? customerId, AppDbContext db) =>
        {
            var query = db.Trials
                .AsNoTracking()
                .Include(t => t.Customer)
                .Include(t => t.Product)
                .AsQueryable();

            if (status is not null)
                query = query.Where(t => t.Status == status.Value);
            if (customerId is not null)
                query = query.Where(t => t.CustomerId == customerId.Value);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var trials = await query
                .OrderByDescending(t => t.StartDate)
                .Select(t => new
                {
                    t.Id,
                    t.CustomerId,
                    t.ProductId,
                    customerName = t.Customer.Name,
                    productName = t.Product.Name,
                    t.StartDate,
                    t.EndDate,
                    restrictionLevel = t.RestrictionLevel,
                    status = t.Status,
                    t.ConvertedContractId,
                    t.CreatedAt,
                    t.UpdatedAt,
                    remainingDays = t.Status == TrialStatus.Active
                        ? Math.Max(0, t.EndDate.DayNumber - today.DayNumber)
                        : 0
                })
                .ToListAsync();

            return Results.Ok(trials);
        }).WithName("GetTrials");

        group.MapPost("/", async (CreateTrialRequest req, AppDbContext db) =>
        {
            // Check for duplicate active trial
            var duplicateActive = await db.Trials.AnyAsync(t =>
                t.CustomerId == req.CustomerId &&
                t.ProductId == req.ProductId &&
                t.Status == TrialStatus.Active);
            if (duplicateActive)
                return Results.Conflict(new { message = "An active trial already exists for this customer and product." });

            var trial = new Trial
            {
                CustomerId = req.CustomerId,
                ProductId = req.ProductId,
                StartDate = req.StartDate,
                EndDate = req.EndDate,
                RestrictionLevel = req.RestrictionLevel ?? TrialRestriction.CapacityLimited
            };

            db.Trials.Add(trial);
            await db.SaveChangesAsync();
            return Results.Created($"/api/trials/{trial.Id}", trial);
        }).WithName("CreateTrial");

        group.MapPost("/{id:guid}/convert", async (Guid id, ConvertTrialRequest req, AppDbContext db) =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var trial = await db.Trials.FindAsync(id);
            if (trial is null)
                return Results.NotFound();

            if (trial.Status != TrialStatus.Active)
                return Results.BadRequest(new { message = "Only active trials can be converted." });

            // Validate plan belongs to the trial's product
            var plan = await db.Plans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.PlanId);
            if (plan is null)
                return Results.BadRequest(new { message = "Plan not found." });
            if (plan.ProductId != trial.ProductId)
                return Results.BadRequest(new { message = "Plan does not belong to the trial's product." });

            // Check for duplicate active contract
            var duplicateActive = await db.Contracts.AnyAsync(c =>
                c.CustomerId == trial.CustomerId &&
                c.ProductId == trial.ProductId &&
                c.Status == ContractStatus.Active);
            if (duplicateActive)
                return Results.Conflict(new { message = "An active contract already exists for this customer and product." });

            var contract = new Contract
            {
                CustomerId = trial.CustomerId,
                ProductId = trial.ProductId,
                PlanId = req.PlanId,
                ContractType = req.ContractType,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow)
            };
            db.Contracts.Add(contract);
            await db.SaveChangesAsync();

            trial.Status = TrialStatus.Converted;
            trial.ConvertedContractId = contract.Id;
            await db.SaveChangesAsync();

            await transaction.CommitAsync();
            return Results.Ok(new { trial, contract });
        }).WithName("ConvertTrial");

        group.MapPost("/{id:guid}/cancel", async (Guid id, AppDbContext db) =>
        {
            var trial = await db.Trials.FindAsync(id);
            if (trial is null)
                return Results.NotFound();

            if (trial.Status != TrialStatus.Active)
                return Results.BadRequest(new { message = "Only active trials can be cancelled." });

            trial.Status = TrialStatus.Cancelled;
            await db.SaveChangesAsync();
            return Results.Ok(trial);
        }).WithName("CancelTrial");

        group.MapPost("/expire", async (AppDbContext db) =>
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var expired = await db.Trials
                .Where(t => t.Status == TrialStatus.Active && t.EndDate < today)
                .ToListAsync();

            foreach (var trial in expired)
            {
                trial.Status = TrialStatus.Expired;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { expiredCount = expired.Count });
        }).WithName("ExpireTrials");

        return group;
    }
}

public record CreateTrialRequest(
    Guid CustomerId,
    Guid ProductId,
    DateOnly StartDate,
    DateOnly EndDate,
    TrialRestriction? RestrictionLevel = null
);

public record ConvertTrialRequest(
    Guid PlanId,
    ContractType ContractType
);
