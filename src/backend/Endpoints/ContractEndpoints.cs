using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class ContractEndpoints
{
    public static RouteGroupBuilder MapContractEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/contracts");

        group.MapGet("/", async (Guid? customerId, Guid? productId, ContractStatus? status, AppDbContext db) =>
        {
            var query = db.Contracts
                .AsNoTracking()
                .Include(c => c.Customer)
                .Include(c => c.Product)
                .Include(c => c.Plan)
                .AsQueryable();

            if (customerId is not null)
                query = query.Where(c => c.CustomerId == customerId.Value);
            if (productId is not null)
                query = query.Where(c => c.ProductId == productId.Value);
            if (status is not null)
                query = query.Where(c => c.Status == status.Value);

            var contracts = await query
                .OrderByDescending(c => c.StartDate)
                .Select(c => new
                {
                    c.Id,
                    c.CustomerId,
                    c.ProductId,
                    c.PlanId,
                    customerName = c.Customer.Name,
                    productName = c.Product.Name,
                    planName = c.Plan.Name,
                    contractType = c.ContractType,
                    c.StartDate,
                    c.EndDate,
                    status = c.Status,
                    c.CreatedAt,
                    c.UpdatedAt
                })
                .ToListAsync();

            return Results.Ok(contracts);
        }).WithName("GetContracts");

        group.MapPost("/", async (CreateContractRequest req, AppDbContext db) =>
        {
            // Validate plan belongs to product
            var plan = await db.Plans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.PlanId);
            if (plan is null)
                return Results.BadRequest(new { message = "Plan not found." });
            if (plan.ProductId != req.ProductId)
                return Results.BadRequest(new { message = "Plan does not belong to the specified product." });

            // Check for duplicate active contract
            var duplicateActive = await db.Contracts.AnyAsync(c =>
                c.CustomerId == req.CustomerId &&
                c.ProductId == req.ProductId &&
                c.Status == ContractStatus.Active);
            if (duplicateActive)
                return Results.Conflict(new { message = "An active contract already exists for this customer and product." });

            var contract = new Contract
            {
                CustomerId = req.CustomerId,
                ProductId = req.ProductId,
                PlanId = req.PlanId,
                ContractType = req.ContractType,
                StartDate = req.StartDate,
                EndDate = req.EndDate
            };

            db.Contracts.Add(contract);
            await db.SaveChangesAsync();
            return Results.Created($"/api/contracts/{contract.Id}", contract);
        }).WithName("CreateContract");

        group.MapPut("/{id:guid}/plan", async (Guid id, ChangePlanRequest req, AppDbContext db) =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var contract = await db.Contracts.FindAsync(id);
            if (contract is null)
                return Results.NotFound();

            var newPlan = await db.Plans.AsNoTracking().FirstOrDefaultAsync(p => p.Id == req.NewPlanId);
            if (newPlan is null)
                return Results.BadRequest(new { message = "New plan not found." });
            if (newPlan.ProductId != contract.ProductId)
                return Results.BadRequest(new { message = "New plan does not belong to the contract's product." });

            var oldPlanId = contract.PlanId;
            contract.PlanId = req.NewPlanId;

            var history = new ContractHistory
            {
                ContractId = id,
                ChangeType = ContractChangeType.PlanChange,
                OldPlanId = oldPlanId,
                NewPlanId = req.NewPlanId,
                Reason = req.Reason,
                ChangedAt = DateTime.UtcNow
            };
            db.ContractHistories.Add(history);

            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Ok(contract);
        }).WithName("ChangePlan");

        group.MapPost("/{id:guid}/cancel", async (Guid id, CancelContractRequest req, AppDbContext db) =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var contract = await db.Contracts.FindAsync(id);
            if (contract is null)
                return Results.NotFound();

            if (contract.Status == ContractStatus.Cancelled)
                return Results.BadRequest(new { message = "Contract is already cancelled." });

            contract.Status = ContractStatus.Cancelled;
            contract.EndDate = req.EndDate;

            var history = new ContractHistory
            {
                ContractId = id,
                ChangeType = ContractChangeType.Cancellation,
                OldPlanId = contract.PlanId,
                Reason = req.Reason,
                ChangedAt = DateTime.UtcNow
            };
            db.ContractHistories.Add(history);

            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Ok(contract);
        }).WithName("CancelContract");

        group.MapGet("/{id:guid}/history", async (Guid id, AppDbContext db) =>
        {
            var contractExists = await db.Contracts.AnyAsync(c => c.Id == id);
            if (!contractExists)
                return Results.NotFound();

            var histories = await db.ContractHistories
                .AsNoTracking()
                .Where(h => h.ContractId == id)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new
                {
                    h.Id,
                    h.ContractId,
                    changeType = h.ChangeType,
                    h.OldPlanId,
                    h.NewPlanId,
                    oldPlanName = h.OldPlan != null ? h.OldPlan.Name : null,
                    newPlanName = h.NewPlan != null ? h.NewPlan.Name : null,
                    h.Reason,
                    h.ChangedAt,
                    h.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(histories);
        }).WithName("GetContractHistory");

        return group;
    }
}

public record CreateContractRequest(
    Guid CustomerId,
    Guid ProductId,
    Guid PlanId,
    ContractType ContractType,
    DateOnly StartDate,
    DateOnly? EndDate = null
);

public record ChangePlanRequest(
    Guid NewPlanId,
    string? Reason = null
);

public record CancelContractRequest(
    DateOnly EndDate,
    string? Reason = null
);
