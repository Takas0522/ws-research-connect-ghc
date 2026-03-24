using SaasManagement.Models;
using SaasManagement.Services;

namespace SaasManagement.Tests.Services;

public class BillingServiceTests
{
    private readonly BillingService _sut = new();

    // ── Flat rate plans ─────────────────────────────────────────────────────

    [Fact]
    public void Calculate_FlatRate_ReturnsMonthlyFee()
    {
        // A plan with no UsageUnitPrice is a flat-rate plan.
        var plan = new Plan { MonthlyFee = 5_000m, UsageUnitPrice = null };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 0, isTrial: false);

        Assert.Equal(5_000m, result);
    }

    [Fact]
    public void Calculate_FlatRate_IgnoresUsageQuantity()
    {
        var plan = new Plan { MonthlyFee = 5_000m, UsageUnitPrice = null };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 999, isTrial: false);

        Assert.Equal(5_000m, result);
    }

    // ── Usage-based plans ────────────────────────────────────────────────────

    [Fact]
    public void Calculate_UsageBased_WithExcess_ReturnsCorrectAmount()
    {
        // BizFlow Standard: MonthlyFee=5,000, UnitPrice=100, FreeTier=50, Usage=162
        // Expected: 5,000 + (162-50) * 100 = 5,000 + 11,200 = 16,200
        var plan = new Plan
        {
            MonthlyFee = 5_000m,
            UsageUnitPrice = 100m,
            FreeUsageLimit = 50m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 162, isTrial: false);

        Assert.Equal(16_200m, result);
    }

    [Fact]
    public void Calculate_UsageBased_WithinFreeTier_ReturnsMonthlyFeeOnly()
    {
        // Usage (30) does not exceed the free tier (50) → only base fee charged.
        var plan = new Plan
        {
            MonthlyFee = 5_000m,
            UsageUnitPrice = 100m,
            FreeUsageLimit = 50m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 30, isTrial: false);

        Assert.Equal(5_000m, result);
    }

    [Fact]
    public void Calculate_ZeroUsage_ReturnsMonthlyFeeOnly()
    {
        var plan = new Plan
        {
            MonthlyFee = 8_000m,
            UsageUnitPrice = 200m,
            FreeUsageLimit = 100m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 0, isTrial: false);

        Assert.Equal(8_000m, result);
    }

    [Fact]
    public void Calculate_NoFreeTier_ChargesAllUsage()
    {
        // FreeUsageLimit is null → all usage is charged.
        // MonthlyFee=10,000, UnitPrice=300, FreeTier=null, Usage=50
        // Expected: 10,000 + 50 * 300 = 25,000
        var plan = new Plan
        {
            MonthlyFee = 10_000m,
            UsageUnitPrice = 300m,
            FreeUsageLimit = null
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 50, isTrial: false);

        Assert.Equal(25_000m, result);
    }

    // ── Hybrid plan (usage-based with a significant free tier) ──────────────

    [Fact]
    public void Calculate_Hybrid_WithExcess_ReturnsCorrectAmount()
    {
        // SecureGate Advanced: MonthlyFee=20,000, UnitPrice=200, FreeTier=100, Usage=295
        // Expected: 20,000 + (295-100) * 200 = 20,000 + 39,000 = 59,000
        var plan = new Plan
        {
            MonthlyFee = 20_000m,
            UsageUnitPrice = 200m,
            FreeUsageLimit = 100m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 295, isTrial: false);

        Assert.Equal(59_000m, result);
    }

    // ── Yearly discount ──────────────────────────────────────────────────────

    [Fact]
    public void Calculate_YearlyDiscount_AppliesOnlyToBaseFee()
    {
        // CloudSync Pro Business: MonthlyFee=15,000, YearlyDiscountRate=10%, flat-rate
        // Expected: 15,000 * (1 - 10/100) = 13,500
        var plan = new Plan
        {
            MonthlyFee = 15_000m,
            UsageUnitPrice = null,
            YearlyDiscountRate = 10m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Yearly, usageQuantity: 0, isTrial: false);

        Assert.Equal(13_500m, result);
    }

    [Fact]
    public void Calculate_YearlyDiscount_NotAppliedToUsagePart()
    {
        // Discount applies only to base fee; usage charges are not discounted.
        // MonthlyFee=10,000, YearlyDiscountRate=20%, UnitPrice=100, FreeTier=0, Usage=50
        // Discounted base: 10,000 * 0.8 = 8,000
        // Usage charge (not discounted): 50 * 100 = 5,000
        // Total: 13,000
        var plan = new Plan
        {
            MonthlyFee = 10_000m,
            UsageUnitPrice = 100m,
            FreeUsageLimit = 0m,
            YearlyDiscountRate = 20m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Yearly, usageQuantity: 50, isTrial: false);

        Assert.Equal(13_000m, result);
    }

    [Fact]
    public void Calculate_MonthlyContract_YearlyDiscountRateSet_DiscountNotApplied()
    {
        // Even if YearlyDiscountRate is configured, it must NOT apply for monthly contracts.
        var plan = new Plan
        {
            MonthlyFee = 15_000m,
            UsageUnitPrice = null,
            YearlyDiscountRate = 10m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 0, isTrial: false);

        Assert.Equal(15_000m, result);
    }

    // ── Trial ────────────────────────────────────────────────────────────────

    [Fact]
    public void Calculate_Trial_ReturnsZero()
    {
        // BR-03: Any plan in trial period must have a billing amount of 0.
        var plan = new Plan
        {
            MonthlyFee = 50_000m,
            UsageUnitPrice = 500m,
            FreeUsageLimit = 0m,
            YearlyDiscountRate = 15m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Yearly, usageQuantity: 1000, isTrial: true);

        Assert.Equal(0m, result);
    }

    [Fact]
    public void Calculate_Trial_FlatRate_ReturnsZero()
    {
        var plan = new Plan { MonthlyFee = 5_000m, UsageUnitPrice = null };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 0, isTrial: true);

        Assert.Equal(0m, result);
    }

    // ── Rounding ─────────────────────────────────────────────────────────────

    [Fact]
    public void Calculate_ResultIsFlooredToInteger()
    {
        // MonthlyFee=100, UnitPrice=1.5, FreeTier=0, Usage=3
        // Total: 100 + 3 * 1.5 = 104.5 → floor → 104
        var plan = new Plan
        {
            MonthlyFee = 100m,
            UsageUnitPrice = 1.5m,
            FreeUsageLimit = 0m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Monthly, usageQuantity: 3, isTrial: false);

        Assert.Equal(104m, result);
    }

    [Fact]
    public void Calculate_YearlyDiscount_ResultIsFlooredToInteger()
    {
        // MonthlyFee=10,000, YearlyDiscountRate=33% (fraction result)
        // Discounted base: 10,000 * 0.67 = 6,700 → floor → 6,700
        var plan = new Plan
        {
            MonthlyFee = 10_000m,
            UsageUnitPrice = null,
            YearlyDiscountRate = 33m
        };

        var result = _sut.CalculateBillingAmount(plan, ContractType.Yearly, usageQuantity: 0, isTrial: false);

        Assert.Equal(6_700m, result);
    }
}
