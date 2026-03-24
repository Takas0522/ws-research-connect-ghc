namespace Backend.Models;

public class Contract
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid ProductId { get; set; }
    public Guid PlanId { get; set; }
    public ContractType ContractType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public ContractStatus Status { get; set; } = ContractStatus.Active;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public Plan Plan { get; set; } = null!;
    public ICollection<ContractHistory> Histories { get; set; } = [];
    public ICollection<MonthlyUsage> MonthlyUsages { get; set; } = [];
}
