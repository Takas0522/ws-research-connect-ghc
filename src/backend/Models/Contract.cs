namespace SaasManagement.Models;

public enum ContractType
{
    Monthly,
    Yearly
}

public enum ContractStatus
{
    Active,
    Cancelled
}

public class Contract
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int ProductId { get; set; }
    public int PlanId { get; set; }
    public ContractType ContractType { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Active;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Customer? Customer { get; set; }
    public Product? Product { get; set; }
    public Plan? Plan { get; set; }
    public ICollection<ContractHistory> Histories { get; set; } = [];
    public ICollection<MonthlyUsage> MonthlyUsages { get; set; } = [];
}
