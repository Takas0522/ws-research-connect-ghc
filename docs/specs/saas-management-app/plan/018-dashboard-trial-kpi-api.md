---
id: task-018
title: "ダッシュボード トライアル KPI API"
execution: delegate
depends_on: [task-017, task-013]
parallel: false
---

# ダッシュボード トライアル KPI API

## 概要

ダッシュボードに表示するトライアル関連の KPI（進行中件数、転換率、期限間近のトライアル）を返す API を実装する。

## 作業内容

- `src/backend/Endpoints/DashboardEndpoints.cs` に追加:
  - `GET /api/dashboard/trials` — トライアル KPI
    - アクティブトライアル数
    - 当月の転換数・期限切れ数
    - 転換率（%）= 転換数 / (転換数 + 期限切れ数 + キャンセル数) × 100
    - 7日以内に期限切れとなるトライアルの一覧（顧客名・製品名・残日数・利用レベル）
- 利用レベル判定: 利用量が多い = "high"、中 = "medium"、低 = "low"（閾値は設定可能に）
- API 仕様は `docs/specs/saas-management-app/system/03-api-design.md` に準拠

## Acceptance Criteria

- [ ] トライアル KPI が正しく計算されること
- [ ] 転換率の計算が正しいこと
- [ ] 7日以内に期限切れのトライアルが取得できること
- [ ] 利用レベルが判定されること
- [ ] `dotnet build` が成功すること

## テスト

### ユニットテスト
- `GetTrialKPI_ReturnsActiveCount`
- `GetTrialKPI_CalculatesConversionRate`
- `GetTrialKPI_ReturnsExpiringTrials`

### E2E テスト
- なし
