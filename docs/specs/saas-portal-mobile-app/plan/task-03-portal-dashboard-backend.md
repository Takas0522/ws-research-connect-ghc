# Task-03: Portal ダッシュボード Backend

## 概要

テナントユーザー向けのダッシュボード API を実装する。
テナントの利用状況サマリー、月次利用推移、利用目的別集計の 3 エンドポイントを提供し、
すべてのデータアクセスは JWT 内の `tenant_id` でスコープ制限する。

## スコープ

### バックエンド

**スキーマ (`app/schemas/portal_dashboard.py`):**
- `ServiceUsageSummary` — service_code, service_name, plan_name, metric_name, quantity, free_tier_limit, usage_rate, billed_amount, mom_change（前月比）
- `DashboardSummaryResponse` — tenant_name, total_services, total_billed_amount, services（ServiceUsageSummary のリスト）
- `UsageTrendItem` — year_month, service_code, service_name, quantity, billed_amount
- `UsageTrendResponse` — trends（UsageTrendItem のリスト）、period（開始〜終了月）
- `UsagePurposeItem` — primary_use_case, count, total_quantity
- `UsageByPurposeResponse` — purposes（UsagePurposeItem のリスト）

**サービス (`app/services/portal_dashboard_service.py`):**
- `get_dashboard_summary(tenant_id)` — テナントの最新月の利用状況サマリーを集計
- `get_usage_trends(tenant_id, months=12)` — 過去 N ヶ月の月次推移データを取得
- `get_usage_by_purpose(tenant_id)` — 利用目的（primary_use_case）別の集計

**ルーター (`app/routers/portal_dashboard.py`):**

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/portal/dashboard/summary` | テナント利用状況サマリー | 必要 |
| GET | `/api/portal/dashboard/trends` | 月次利用推移（12 ヶ月） | 必要 |
| GET | `/api/portal/dashboard/usage-by-purpose` | 利用目的別集計 | 必要 |

### データモデル

- `portal_subscriptions` — 契約サービス情報（サービス名、プラン、基本料金、上限）
- `portal_usage_metrics` — 月次利用実績（quantity, usage_rate, billed_amount, primary_use_case）

## Acceptance Criteria

- [ ] AC-03-01: テナント管理者が `/api/portal/dashboard/summary` を呼ぶと、テナント名・契約サービス数・合計請求額・各サービスの利用状況（利用量 / 上限、利用率、前月比）が返される
- [ ] AC-03-02: テナント一般ユーザーが `/api/portal/dashboard/summary` を呼んでも、同じテナントのサマリーが返される（admin / member 共通）
- [ ] AC-03-03: `/api/portal/dashboard/trends` を呼ぶと、過去 12 ヶ月分のサービス別月次利用量・請求額の推移データが返される
- [ ] AC-03-04: `/api/portal/dashboard/usage-by-purpose` を呼ぶと、利用目的（primary_use_case）ごとの件数・合計利用量が返される
- [ ] AC-03-05: 認証なしで `/api/portal/dashboard/summary` を呼ぶと、401 エラーが返される

## 依存関係

- 前提タスク: Task-02（`get_current_portal_user` 認証依存）
- 並行実行: Task-04, Task-05 と並行実行可能

## 実装メモ

- 既存の `app/services/dashboard_service.py` の集計パターン（MongoDB Aggregation Pipeline）を参考にする
- `portal_usage_metrics` の `year_month` フィールドで月次集計する
- 前月比（mom_change）は `(当月 - 前月) / 前月 * 100` で算出する（前月データがない場合は null）
- `primary_use_case` が null のレコードは「その他」としてグルーピングする
- テナントスコープ: すべてのクエリに `{"tenant_id": ObjectId(current_user.tenant_id)}` フィルタを適用する
