using SaasManagement.Models;

namespace SaasManagement.Services;

public interface IBillingService
{
    decimal CalculateBillingAmount(Plan plan, ContractType contractType, decimal usageQuantity, bool isTrial);
}

public class BillingService : IBillingService
{
    /// <summary>
    /// Calculates the billing amount based on plan, contract type, usage, and trial status.
    /// BR-01: Flat rate if UsageUnitPrice is null; otherwise base fee + excess usage × unit price.
    /// BR-02: Yearly discount applies only to the base monthly fee.
    /// BR-03: Trial period → billing amount = 0.
    /// Result is rounded down to the nearest integer (Math.Floor).
    /// </summary>
    public decimal CalculateBillingAmount(Plan plan, ContractType contractType, decimal usageQuantity, bool isTrial)
    {
        // BR-03: Trial → zero billing
        if (isTrial)
        {
            return 0m;
        }

        decimal baseFee = plan.MonthlyFee;

        // BR-02: Apply yearly discount to base fee only
        if (contractType == ContractType.Yearly && plan.YearlyDiscountRate.HasValue)
        {
            baseFee = baseFee * (1m - plan.YearlyDiscountRate.Value / 100m);
        }

        // BR-01: Flat rate — return discounted base fee
        if (!plan.UsageUnitPrice.HasValue)
        {
            return Math.Floor(baseFee);
        }

        // BR-01: Usage-based — add charges for usage exceeding free tier
        decimal freeLimit = plan.FreeUsageLimit ?? 0m;
        decimal excessUsage = Math.Max(0m, usageQuantity - freeLimit);
        decimal totalAmount = baseFee + excessUsage * plan.UsageUnitPrice.Value;

        return Math.Floor(totalAmount);
    }
}
