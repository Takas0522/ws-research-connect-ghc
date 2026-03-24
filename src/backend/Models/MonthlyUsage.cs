namespace Backend.Models;

public class MonthlyUsage
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public string YearMonth { get; set; } = string.Empty;
    public decimal UsageQuantity { get; set; }
    public decimal BillingAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Contract Contract { get; set; } = null!;
}
