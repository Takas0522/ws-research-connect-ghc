---
id: task-013
title: "ダッシュボード API（売上集計・顧客サマリ）"
execution: delegate
depends_on: [task-010]
parallel: true
---

# ダッシュボード API（売上集計・顧客サマリ）

## 概要

ダッシュボード表示に必要な売上推移、製品別売上、顧客別サマリの集計 API を実装する。

## 作業内容

- `src/backend/Endpoints/DashboardEndpoints.cs` を作成:
  - `GET /api/dashboard/revenue` — 月次売上推移
    - クエリパラメータ: from（YYYY-MM）, to（YYYY-MM）
    - レスポンス: 月ごとの合計売上 + 製品別内訳
  - `GET /api/dashboard/customers` — 顧客別サマリ
    - レスポンス: 顧客ごとの契約数・直近月額合計・トレンド（increasing/decreasing/stable）
- 集計クエリは EF Core の LINQ で実装
- トライアル中の契約は売上集計に含めない（billing_amount = 0 のため自然に除外）
- API 仕様は `docs/specs/saas-management-app/system/03-api-design.md` に準拠

## Acceptance Criteria

- [ ] 月次売上推移が期間指定で取得できること
- [ ] 製品別の売上内訳が含まれること
- [ ] 顧客別サマリが取得でき、契約数・月額合計・トレンドが含まれること
- [ ] トレンド判定（直近2ヶ月の比較: 5%以上増 = increasing、5%以上減 = decreasing、その他 = stable）が動作すること
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト
- `GetRevenue_ReturnsMonthlySummary`
- `GetRevenue_FiltersByPeriod`
- `GetRevenue_IncludesProductBreakdown`
- `GetCustomerSummary_ReturnsTrend`

### E2E テスト
- なし
