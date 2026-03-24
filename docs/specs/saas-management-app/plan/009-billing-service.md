---
id: task-009
title: "BillingService（請求額計算ロジック）"
execution: delegate
depends_on: [task-002]
parallel: true
---

# BillingService（請求額計算ロジック）

## 概要

プランの課金ルールと利用量に基づく請求額自動計算ロジックを実装する。固定料金型・従量課金型・ハイブリッド型の3パターンに対応し、年契割引とトライアル判定を含む。

## 作業内容

- `src/backend/Services/BillingService.cs` を作成:
  - `CalculateBillingAmount(Plan plan, ContractType contractType, decimal usageQuantity, bool isTrial)` メソッド
  - BR-01: 基本計算フロー
    - 従量単価が null → 固定料金型 → 月額基本料を返す
    - 従量単価あり → `月額基本料 + MAX(0, 利用量 - 無料枠) × 従量単価`
  - BR-02: 年契割引 — 年契かつ割引率設定あり → `月額基本料 × (1 - 割引率/100)`、従量部分には適用しない
  - BR-03: トライアル中 → 請求額 = 0
  - 請求額は円単位（小数切り捨て = `Math.Floor`）
- DI 登録: `IServiceCollection.AddScoped<BillingService>()`
- ビジネスルールは `docs/specs/saas-management-app/business/05-business-rules.md` に準拠

## Acceptance Criteria

- [ ] 固定料金型の計算が正しいこと（例: CloudSync Pro Starter = ¥5,000）
- [ ] 従量課金型の計算が正しいこと（例: BizFlow Standard 162件 = ¥13,100）
- [ ] ハイブリッド型の計算が正しいこと（例: SecureGate Advanced 295ユーザー = ¥67,600）
- [ ] 年契割引が月額基本料にのみ適用されること
- [ ] 利用量が無料枠以内の場合、従量課金が 0 であること
- [ ] トライアル中は請求額が 0 であること
- [ ] 小数の切り捨てが正しいこと
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト（必須: 仕様書の計算例を全てカバー）
- `Calculate_FlatRate_ReturnsMonthlyFee`
- `Calculate_UsageBased_WithExcess_ReturnsCorrectAmount` （BizFlow Standard 162件 = ¥13,100）
- `Calculate_UsageBased_WithinFreeTier_ReturnsMonthlyFeeOnly`
- `Calculate_Hybrid_WithExcess_ReturnsCorrectAmount` （SecureGate Advanced 295ユーザー = ¥67,600）
- `Calculate_YearlyDiscount_AppliesOnlyToBaseFee` （CloudSync Pro Business 年契 = ¥13,500）
- `Calculate_YearlyDiscount_NotAppliedToUsagePart`
- `Calculate_Trial_ReturnsZero`
- `Calculate_ZeroUsage_ReturnsMonthlyFeeOnly`
- `Calculate_NoFreeTier_ChargesAllUsage`

### E2E テスト
- なし
