using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class PlanEndpoints
{
    public static RouteGroupBuilder MapPlanEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api");

        group.MapPost("/products/{productId:guid}/plans", async (Guid productId, CreatePlanRequest req, AppDbContext db) =>
        {
            var productExists = await db.Products.AnyAsync(p => p.Id == productId);
            if (!productExists)
                return Results.NotFound(new { message = "Product not found." });

            var plan = new Plan
            {
                ProductId = productId,
                Name = req.Name,
                MonthlyFee = req.MonthlyFee,
                UnitPrice = req.UnitPrice,
                FreeTierQuantity = req.FreeTierQuantity,
                FreeTierUnit = req.FreeTierUnit,
                BillingCycleDiscount = req.BillingCycleDiscount,
                Note = req.Note
            };

            db.Plans.Add(plan);
            await db.SaveChangesAsync();
            return Results.Created($"/api/plans/{plan.Id}", plan);
        }).WithName("CreatePlan");

        group.MapPut("/plans/{id:guid}", async (Guid id, UpdatePlanRequest req, AppDbContext db) =>
        {
            var plan = await db.Plans.FindAsync(id);
            if (plan is null)
                return Results.NotFound();

            if (req.Name is not null) plan.Name = req.Name;
            if (req.MonthlyFee is not null) plan.MonthlyFee = req.MonthlyFee.Value;
            if (req.UnitPrice is not null) plan.UnitPrice = req.UnitPrice;
            if (req.FreeTierQuantity is not null) plan.FreeTierQuantity = req.FreeTierQuantity;
            if (req.FreeTierUnit is not null) plan.FreeTierUnit = req.FreeTierUnit;
            if (req.BillingCycleDiscount is not null) plan.BillingCycleDiscount = req.BillingCycleDiscount;
            if (req.Note is not null) plan.Note = req.Note;

            await db.SaveChangesAsync();
            return Results.Ok(plan);
        }).WithName("UpdatePlan");

        return group;
    }
}

public record CreatePlanRequest(
    string Name,
    decimal MonthlyFee,
    decimal? UnitPrice = null,
    decimal? FreeTierQuantity = null,
    string? FreeTierUnit = null,
    decimal? BillingCycleDiscount = null,
    string? Note = null
);

public record UpdatePlanRequest(
    string? Name = null,
    decimal? MonthlyFee = null,
    decimal? UnitPrice = null,
    decimal? FreeTierQuantity = null,
    string? FreeTierUnit = null,
    decimal? BillingCycleDiscount = null,
    string? Note = null
);
