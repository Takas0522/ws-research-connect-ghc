namespace SaasManagement.Models;

public enum TrialRestriction
{
    None,
    Limited
}

public enum TrialStatus
{
    Active,
    Converted,
    Cancelled,
    Expired
}

public class Trial
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int ProductId { get; set; }
    public int PlanId { get; set; }
    public TrialRestriction Restriction { get; set; }
    public TrialStatus Status { get; set; } = TrialStatus.Active;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? ConvertedContractId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Customer? Customer { get; set; }
    public Product? Product { get; set; }
    public Plan? Plan { get; set; }
}
