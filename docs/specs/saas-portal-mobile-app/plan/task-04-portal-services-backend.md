# Task-04: Portal サービス一覧・起動 Backend

## 概要

テナントが契約しているサービスの一覧表示と、サービス別利用詳細、Mock アプリ起動の API を実装する。
PoC フェーズではアプリ起動はダミー URL を返す Mock 実装とする。

## スコープ

### バックエンド

**スキーマ (`app/schemas/portal_subscription.py`):**
- `SubscriptionResponse` — id, service_code, service_name, plan_name, status, base_price, contract_start_date, contract_end_date
- `SubscriptionListResponse` — subscriptions（SubscriptionResponse のリスト）、total_count

**スキーマ (`app/schemas/portal_usage.py`):**
- `ServiceUsageDetail` — year_month, metric_name, quantity, usage_rate, billed_amount, primary_use_case
- `ServiceUsageResponse` — service_code, service_name, plan_name, free_tier_limit, overage_unit_price, usage_details（ServiceUsageDetail のリスト）

**スキーマ (`app/schemas/portal_service_launch.py`):**
- `ServiceLaunchResponse` — service_code, service_name, launch_url, launched_at, is_mock

**サービス (`app/services/portal_subscription_service.py`):**
- `get_subscriptions(tenant_id)` — テナントの契約サービス一覧を取得
- `get_service_usage(tenant_id, service_code)` — サービス別の月次利用詳細を取得

**サービス (`app/services/portal_service_launch_service.py`):**
- `launch_service(tenant_id, service_code)` — アプリ起動（PoC は Mock URL を返す）

**ルーター (`app/routers/portal_services.py`):**

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/api/portal/services` | 契約サービス一覧 | 必要 |
| GET | `/api/portal/services/{service_code}/usage` | サービス別利用詳細 | 必要 |
| POST | `/api/portal/services/{service_code}/launch` | アプリ起動（Mock） | 必要 |

### データモデル

- `portal_subscriptions` — 契約サービス情報
- `portal_usage_metrics` — 月次利用実績

## Acceptance Criteria

- [ ] AC-04-01: テナントユーザーが `/api/portal/services` を呼ぶと、自テナントの契約サービス一覧（service_code, service_name, plan_name, status, 契約期間）が返される
- [ ] AC-04-02: 他テナントの契約サービスは一覧に含まれない（テナントスコープ）
- [ ] AC-04-03: `/api/portal/services/CONNECT_CHAT/usage` を呼ぶと、ConnectChat の月次利用詳細（12 ヶ月分の利用量、利用率、請求額）が返される
- [ ] AC-04-04: `/api/portal/services/CONNECT_CHAT/launch` を POST すると、Mock の launch_url（例: `https://mock.connect-chat.example.com`）と `is_mock: true` が返される
- [ ] AC-04-05: 契約していないサービスコードで利用詳細を呼ぶと、404 エラー「契約が見つかりません」が返される

## 依存関係

- 前提タスク: Task-02（`get_current_portal_user` 認証依存）
- 並行実行: Task-03, Task-05 と並行実行可能

## 実装メモ

- Mock アプリ起動の URL マッピング:
  - `CONNECT_CHAT` → `https://mock.connect-chat.example.com`
  - `CONNECT_MEET` → `https://mock.connect-meet.example.com`
  - `CONNECT_STORE` → `https://mock.connect-store.example.com`
- Phase 1 では Mock URL をディープリンク URL に置き換える
- `is_mock: true` フラグで PoC と本番を区別できるようにする
- サービス別利用詳細は `portal_usage_metrics` を `service_code` + `tenant_id` でフィルタし、`year_month` 降順でソートする
