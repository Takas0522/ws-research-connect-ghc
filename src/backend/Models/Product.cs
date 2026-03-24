namespace Backend.Models;

public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public ProductStatus Status { get; set; } = ProductStatus.Active;
    public DateOnly? LaunchedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Plan> Plans { get; set; } = [];
    public ICollection<Contract> Contracts { get; set; } = [];
    public ICollection<Trial> Trials { get; set; } = [];
}
