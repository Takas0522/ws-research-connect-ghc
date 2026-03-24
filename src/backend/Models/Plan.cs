namespace Backend.Models;

public class Plan
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyFee { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? FreeTierQuantity { get; set; }
    public string? FreeTierUnit { get; set; }
    public decimal? BillingCycleDiscount { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Product Product { get; set; } = null!;
}
