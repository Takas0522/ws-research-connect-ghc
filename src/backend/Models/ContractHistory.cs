namespace Backend.Models;

public class ContractHistory
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public ContractChangeType ChangeType { get; set; }
    public Guid? OldPlanId { get; set; }
    public Guid? NewPlanId { get; set; }
    public string? Reason { get; set; }
    public DateTime ChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Contract Contract { get; set; } = null!;
    public Plan? OldPlan { get; set; }
    public Plan? NewPlan { get; set; }
}
