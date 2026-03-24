---
id: task-020
title: "ダッシュボードにトライアル KPI 統合"
execution: delegate
depends_on: [task-018, task-015]
parallel: false
---

# ダッシュボードにトライアル KPI 統合

## 概要

ダッシュボード画面にトライアル KPI（進行中件数・転換率・期限間近のトライアル）を追加する。

## 作業内容

- `src/frontend/src/pages/DashboardPage.tsx` を拡張:
  - **KPI カード**にトライアル情報を追加:
    - 進行中トライアル件数
    - 転換率（%）
  - **期限間近のトライアル**セクション:
    - 残7日以内のトライアルをリスト表示
    - 顧客名・製品名・残日数・利用レベル
    - 残日数の色分け表示
- ダッシュボード API `/api/dashboard/trials` からデータ取得
- 画面設計は `docs/specs/saas-management-app/system/04-frontend-design.md` に準拠

## Acceptance Criteria

- [ ] KPI カードにトライアル情報が表示されること
- [ ] 期限間近のトライアルがリスト表示されること
- [ ] 残日数の色分けがトライアル一覧と同様に動作すること
- [ ] `npm run build` が成功すること

## テスト

### ユニットテスト
- `DashboardPage_RendersTrialKPI`

### E2E テスト
- なし（task-021 で実施）
