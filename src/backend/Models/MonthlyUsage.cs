namespace SaasManagement.Models;

public class MonthlyUsage
{
    public int Id { get; set; }
    public int ContractId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal UsageQuantity { get; set; }
    public decimal BillingAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Contract? Contract { get; set; }
}
