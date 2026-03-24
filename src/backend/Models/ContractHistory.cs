namespace SaasManagement.Models;

public enum ContractChangeType
{
    PlanChange,
    Cancellation
}

public class ContractHistory
{
    public int Id { get; set; }
    public int ContractId { get; set; }
    public ContractChangeType ChangeType { get; set; }
    public int? PreviousPlanId { get; set; }
    public int? NewPlanId { get; set; }
    public string? Notes { get; set; }
    public DateTime ChangedAt { get; set; }

    public Contract? Contract { get; set; }
    public Plan? PreviousPlan { get; set; }
    public Plan? NewPlan { get; set; }
}
