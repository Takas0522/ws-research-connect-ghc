using NpgsqlTypes;

namespace Backend.Models;

public enum ProductStatus
{
    [PgName("active")] Active,
    [PgName("beta")] Beta,
    [PgName("discontinued")] Discontinued
}

public enum ContractType
{
    [PgName("monthly")] Monthly,
    [PgName("yearly")] Yearly
}

public enum ContractStatus
{
    [PgName("active")] Active,
    [PgName("cancelled")] Cancelled
}

public enum ContractChangeType
{
    [PgName("plan_change")] PlanChange,
    [PgName("cancellation")] Cancellation,
    [PgName("type_change")] TypeChange
}

public enum TrialRestriction
{
    [PgName("full")] Full,
    [PgName("feature_limited")] FeatureLimited,
    [PgName("capacity_limited")] CapacityLimited
}

public enum TrialStatus
{
    [PgName("active")] Active,
    [PgName("converted")] Converted,
    [PgName("expired")] Expired,
    [PgName("cancelled")] Cancelled
}
