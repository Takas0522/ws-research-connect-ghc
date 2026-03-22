using System.Runtime.Serialization;

namespace Backend.Models;

public enum ProductStatus
{
    [EnumMember(Value = "active")]
    Active,
    [EnumMember(Value = "beta")]
    Beta,
    [EnumMember(Value = "discontinued")]
    Discontinued
}

public enum ContractType
{
    [EnumMember(Value = "monthly")]
    Monthly,
    [EnumMember(Value = "yearly")]
    Yearly
}

public enum ContractStatus
{
    [EnumMember(Value = "active")]
    Active,
    [EnumMember(Value = "cancelled")]
    Cancelled
}

public enum ContractChangeType
{
    [EnumMember(Value = "plan_change")]
    PlanChange,
    [EnumMember(Value = "cancellation")]
    Cancellation,
    [EnumMember(Value = "type_change")]
    TypeChange
}

public enum TrialRestriction
{
    [EnumMember(Value = "full")]
    Full,
    [EnumMember(Value = "feature_limited")]
    FeatureLimited,
    [EnumMember(Value = "capacity_limited")]
    CapacityLimited
}

public enum TrialStatus
{
    [EnumMember(Value = "active")]
    Active,
    [EnumMember(Value = "converted")]
    Converted,
    [EnumMember(Value = "expired")]
    Expired,
    [EnumMember(Value = "cancelled")]
    Cancelled
}
