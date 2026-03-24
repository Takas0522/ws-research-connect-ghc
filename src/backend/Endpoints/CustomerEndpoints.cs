using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Endpoints;

public static class CustomerEndpoints
{
    public static RouteGroupBuilder MapCustomerEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/customers");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var customers = await db.Customers
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    c.Code,
                    c.Name,
                    c.Contact,
                    c.Note,
                    c.CreatedAt,
                    c.UpdatedAt,
                    activeContractCount = c.Contracts.Count(ct => ct.Status == ContractStatus.Active),
                    monthlyTotal = c.Contracts
                        .Where(ct => ct.Status == ContractStatus.Active)
                        .SelectMany(ct => ct.MonthlyUsages)
                        .OrderByDescending(u => u.YearMonth)
                        .Select(u => (decimal?)u.BillingAmount)
                        .FirstOrDefault() ?? 0m
                })
                .OrderBy(c => c.Code)
                .ToListAsync();
            return Results.Ok(customers);
        }).WithName("GetCustomers");

        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var customer = await db.Customers
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Code,
                    c.Name,
                    c.Contact,
                    c.Note,
                    c.CreatedAt,
                    c.UpdatedAt,
                    contracts = c.Contracts.Select(ct => new
                    {
                        ct.Id,
                        ct.CustomerId,
                        ct.ProductId,
                        ct.PlanId,
                        productName = ct.Product.Name,
                        planName = ct.Plan.Name,
                        contractType = ct.ContractType,
                        ct.StartDate,
                        ct.EndDate,
                        status = ct.Status,
                        ct.CreatedAt,
                        ct.UpdatedAt,
                        latestUsage = ct.MonthlyUsages
                            .OrderByDescending(u => u.YearMonth)
                            .Select(u => new
                            {
                                u.YearMonth,
                                u.UsageQuantity,
                                u.BillingAmount
                            })
                            .FirstOrDefault()
                    }).OrderByDescending(ct => ct.StartDate).ToList()
                })
                .FirstOrDefaultAsync();

            return customer is null ? Results.NotFound() : Results.Ok(customer);
        }).WithName("GetCustomer");

        group.MapPost("/", async (CreateCustomerRequest req, AppDbContext db) =>
        {
            var exists = await db.Customers.AnyAsync(c => c.Code == req.Code);
            if (exists)
                return Results.Conflict(new { message = "Customer with this code already exists." });

            var customer = new Customer
            {
                Code = req.Code,
                Name = req.Name,
                Contact = req.Contact,
                Note = req.Note
            };

            db.Customers.Add(customer);
            await db.SaveChangesAsync();
            return Results.Created($"/api/customers/{customer.Id}", customer);
        }).WithName("CreateCustomer");

        group.MapPut("/{id:guid}", async (Guid id, UpdateCustomerRequest req, AppDbContext db) =>
        {
            var customer = await db.Customers.FindAsync(id);
            if (customer is null)
                return Results.NotFound();

            if (req.Name is not null) customer.Name = req.Name;
            if (req.Contact is not null) customer.Contact = req.Contact;
            if (req.Note is not null) customer.Note = req.Note;

            await db.SaveChangesAsync();
            return Results.Ok(customer);
        }).WithName("UpdateCustomer");

        return group;
    }
}

public record CreateCustomerRequest(
    string Code,
    string Name,
    string? Contact = null,
    string? Note = null
);

public record UpdateCustomerRequest(
    string? Name = null,
    string? Contact = null,
    string? Note = null
);
