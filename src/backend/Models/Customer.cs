namespace Backend.Models;

public class Customer
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Contact { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Contract> Contracts { get; set; } = [];
    public ICollection<Trial> Trials { get; set; } = [];
}
