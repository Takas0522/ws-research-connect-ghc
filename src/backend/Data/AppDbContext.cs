using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<ContractHistory> ContractHistories => Set<ContractHistory>();
    public DbSet<MonthlyUsage> MonthlyUsages => Set<MonthlyUsage>();
    public DbSet<Trial> Trials => Set<Trial>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresEnum<ProductStatus>("public", "product_status");
        modelBuilder.HasPostgresEnum<ContractType>("public", "contract_type");
        modelBuilder.HasPostgresEnum<ContractStatus>("public", "contract_status");
        modelBuilder.HasPostgresEnum<ContractChangeType>("public", "contract_change_type");
        modelBuilder.HasPostgresEnum<TrialRestriction>("public", "trial_restriction");
        modelBuilder.HasPostgresEnum<TrialStatus>("public", "trial_status");

        // Products
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Summary).HasColumnName("summary");
            entity.Property(e => e.Status).HasColumnName("status").IsRequired();
            entity.Property(e => e.LaunchedAt).HasColumnName("launched_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Plans
        modelBuilder.Entity<Plan>(entity =>
        {
            entity.ToTable("plans");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.MonthlyFee).HasColumnName("monthly_fee").HasColumnType("decimal(12,0)");
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price").HasColumnType("decimal(12,2)");
            entity.Property(e => e.FreeTierQuantity).HasColumnName("free_tier_quantity").HasColumnType("decimal(12,2)");
            entity.Property(e => e.FreeTierUnit).HasColumnName("free_tier_unit").HasMaxLength(50);
            entity.Property(e => e.BillingCycleDiscount).HasColumnName("billing_cycle_discount").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => new { e.ProductId, e.Name }).IsUnique();
            entity.HasIndex(e => e.ProductId);

            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Plans)
                  .HasForeignKey(e => e.ProductId);
        });

        // Customers
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.Code).HasColumnName("code").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Contact).HasColumnName("contact");
            entity.Property(e => e.Note).HasColumnName("note");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Contracts
        modelBuilder.Entity<Contract>(entity =>
        {
            entity.ToTable("contracts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.PlanId).HasColumnName("plan_id").IsRequired();
            entity.Property(e => e.ContractType).HasColumnName("contract_type").IsRequired();
            entity.Property(e => e.StartDate).HasColumnName("start_date").IsRequired();
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.Status).HasColumnName("status").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.PlanId);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Contracts)
                  .HasForeignKey(e => e.CustomerId);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Contracts)
                  .HasForeignKey(e => e.ProductId);
            entity.HasOne(e => e.Plan)
                  .WithMany()
                  .HasForeignKey(e => e.PlanId);
        });

        // ContractHistories
        modelBuilder.Entity<ContractHistory>(entity =>
        {
            entity.ToTable("contract_histories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ContractId).HasColumnName("contract_id").IsRequired();
            entity.Property(e => e.ChangeType).HasColumnName("change_type").IsRequired();
            entity.Property(e => e.OldPlanId).HasColumnName("old_plan_id");
            entity.Property(e => e.NewPlanId).HasColumnName("new_plan_id");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.ContractId);
            entity.HasIndex(e => e.ChangedAt);

            entity.HasOne(e => e.Contract)
                  .WithMany(c => c.Histories)
                  .HasForeignKey(e => e.ContractId);
            entity.HasOne(e => e.OldPlan)
                  .WithMany()
                  .HasForeignKey(e => e.OldPlanId);
            entity.HasOne(e => e.NewPlan)
                  .WithMany()
                  .HasForeignKey(e => e.NewPlanId);
        });

        // MonthlyUsages
        modelBuilder.Entity<MonthlyUsage>(entity =>
        {
            entity.ToTable("monthly_usages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.ContractId).HasColumnName("contract_id").IsRequired();
            entity.Property(e => e.YearMonth).HasColumnName("year_month").HasMaxLength(7).IsRequired();
            entity.Property(e => e.UsageQuantity).HasColumnName("usage_quantity").HasColumnType("decimal(12,2)");
            entity.Property(e => e.BillingAmount).HasColumnName("billing_amount").HasColumnType("decimal(12,0)");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => new { e.ContractId, e.YearMonth }).IsUnique();
            entity.HasIndex(e => e.ContractId);
            entity.HasIndex(e => e.YearMonth);

            entity.HasOne(e => e.Contract)
                  .WithMany(c => c.MonthlyUsages)
                  .HasForeignKey(e => e.ContractId);
        });

        // Trials
        modelBuilder.Entity<Trial>(entity =>
        {
            entity.ToTable("trials");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id").IsRequired();
            entity.Property(e => e.ProductId).HasColumnName("product_id").IsRequired();
            entity.Property(e => e.StartDate).HasColumnName("start_date").IsRequired();
            entity.Property(e => e.EndDate).HasColumnName("end_date").IsRequired();
            entity.Property(e => e.RestrictionLevel).HasColumnName("restriction_level").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").IsRequired();
            entity.Property(e => e.ConvertedContractId).HasColumnName("converted_contract_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");

            entity.HasIndex(e => e.CustomerId);
            entity.HasIndex(e => e.ProductId);
            entity.HasIndex(e => e.Status);

            entity.HasOne(e => e.Customer)
                  .WithMany(c => c.Trials)
                  .HasForeignKey(e => e.CustomerId);
            entity.HasOne(e => e.Product)
                  .WithMany(p => p.Trials)
                  .HasForeignKey(e => e.ProductId);
            entity.HasOne(e => e.ConvertedContract)
                  .WithMany()
                  .HasForeignKey(e => e.ConvertedContractId);
        });
    }
}
