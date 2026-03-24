using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class ProductEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/products");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var products = await db.Products
                .AsNoTracking()
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Category,
                    p.Summary,
                    status = p.Status,
                    p.LaunchedAt,
                    p.CreatedAt,
                    p.UpdatedAt,
                    planCount = p.Plans.Count,
                    activeContractCount = p.Contracts.Count(c => c.Status == ContractStatus.Active)
                })
                .OrderBy(p => p.Name)
                .ToListAsync();
            return Results.Ok(products);
        }).WithName("GetProducts");

        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var product = await db.Products
                .AsNoTracking()
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Category,
                    p.Summary,
                    status = p.Status,
                    p.LaunchedAt,
                    p.CreatedAt,
                    p.UpdatedAt,
                    plans = p.Plans.Select(pl => new
                    {
                        pl.Id,
                        pl.ProductId,
                        pl.Name,
                        pl.MonthlyFee,
                        pl.UnitPrice,
                        pl.FreeTierQuantity,
                        pl.FreeTierUnit,
                        pl.BillingCycleDiscount,
                        pl.Note,
                        pl.CreatedAt,
                        pl.UpdatedAt
                    }).OrderBy(pl => pl.Name).ToList()
                })
                .FirstOrDefaultAsync();

            return product is null ? Results.NotFound() : Results.Ok(product);
        }).WithName("GetProduct");

        group.MapPost("/", async (CreateProductRequest req, AppDbContext db) =>
        {
            var exists = await db.Products.AnyAsync(p => p.Name == req.Name);
            if (exists)
                return Results.Conflict(new { message = "Product with this name already exists." });

            var product = new Product
            {
                Name = req.Name,
                Category = req.Category,
                Summary = req.Summary,
                Status = req.Status ?? ProductStatus.Active,
                LaunchedAt = req.LaunchedAt
            };

            db.Products.Add(product);
            await db.SaveChangesAsync();
            return Results.Created($"/api/products/{product.Id}", product);
        }).WithName("CreateProduct");

        group.MapPut("/{id:guid}", async (Guid id, UpdateProductRequest req, AppDbContext db) =>
        {
            var product = await db.Products.FindAsync(id);
            if (product is null)
                return Results.NotFound();

            if (req.Name is not null) product.Name = req.Name;
            if (req.Category is not null) product.Category = req.Category;
            if (req.Summary is not null) product.Summary = req.Summary;
            if (req.Status is not null) product.Status = req.Status.Value;
            if (req.LaunchedAt is not null) product.LaunchedAt = req.LaunchedAt;

            await db.SaveChangesAsync();
            return Results.Ok(product);
        }).WithName("UpdateProduct");

        return group;
    }
}

public record CreateProductRequest(
    string Name,
    string Category,
    string? Summary = null,
    ProductStatus? Status = null,
    DateOnly? LaunchedAt = null
);

public record UpdateProductRequest(
    string? Name = null,
    string? Category = null,
    string? Summary = null,
    ProductStatus? Status = null,
    DateOnly? LaunchedAt = null
);
