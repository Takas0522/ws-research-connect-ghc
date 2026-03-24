using Backend.Models;

namespace Backend.Services;

public class BillingService
{
    /// <summary>
    /// 請求額を計算する。
    /// - 固定料金型 (unit_price is null): billing = monthly_fee
    /// - 従量課金型 (unit_price is set): billing = monthly_fee + MAX(0, usage - freeTier) × unitPrice
    /// - 年契割引 (yearly + discount): monthly_fee に割引を適用（従量部分は対象外）
    /// - トライアル中: 0
    /// 結果は floor して整数（円）で返す。
    /// </summary>
    public decimal Calculate(Plan plan, ContractType contractType, decimal usageQuantity, bool isTrial = false)
    {
        if (isTrial)
            return 0m;

        var baseFee = plan.MonthlyFee;

        // 年契割引の適用（基本料金のみ）
        if (contractType == ContractType.Yearly && plan.BillingCycleDiscount is not null)
        {
            baseFee = baseFee * (1m - plan.BillingCycleDiscount.Value / 100m);
        }

        // 固定料金型
        if (plan.UnitPrice is null)
        {
            return Math.Floor(baseFee);
        }

        // 従量課金型
        var freeTier = plan.FreeTierQuantity ?? 0m;
        var billableUsage = Math.Max(0m, usageQuantity - freeTier);
        var usageFee = billableUsage * plan.UnitPrice.Value;

        return Math.Floor(baseFee + usageFee);
    }
}
