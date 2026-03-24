namespace SaasManagement.Models;

public class Plan
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyFee { get; set; }
    public decimal? UsageUnitPrice { get; set; }
    public decimal? FreeUsageLimit { get; set; }
    public decimal? YearlyDiscountRate { get; set; }

    public Product? Product { get; set; }
}
