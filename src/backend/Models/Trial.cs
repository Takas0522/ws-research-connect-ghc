namespace Backend.Models;

public class Trial
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public Guid ProductId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public TrialRestriction RestrictionLevel { get; set; } = TrialRestriction.CapacityLimited;
    public TrialStatus Status { get; set; } = TrialStatus.Active;
    public Guid? ConvertedContractId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Customer Customer { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public Contract? ConvertedContract { get; set; }
}
