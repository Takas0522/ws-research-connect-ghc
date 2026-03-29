# Task-09: Backend ディープリンク対応

## 概要

PoC で Mock 実装していたアプリ起動 API を、実際のディープリンク URL を返す方式に拡張する。
サービスごとのディープリンク URL マッピングを設定可能にし、`is_mock` フラグで Mock / 本番を切り替えられるようにする。

## スコープ

### バックエンド

**スキーマ更新 (`app/schemas/portal_service_launch.py`):**
- `ServiceLaunchResponse` に `deeplink_url` フィールドを追加
- `is_mock: false` の場合にディープリンク URL を返すように変更

**サービス更新 (`app/services/portal_service_launch_service.py`):**
- ディープリンク URL マッピング設定（環境変数またはコレクションで管理）
  - `CONNECT_CHAT` → `connect-chat://launch?tenant_id={tenant_id}&user_id={user_id}`
  - `CONNECT_MEET` → `connect-meet://launch?tenant_id={tenant_id}&user_id={user_id}`
  - `CONNECT_STORE` → `connect-store://launch?tenant_id={tenant_id}&user_id={user_id}`
- `is_mock` フラグの切り替え（環境変数 `PORTAL_LAUNCH_MODE=mock|deeplink`）

**ルーター更新 (`app/routers/portal_services.py`):**
- `POST /api/portal/services/{service_code}/launch` のレスポンスを拡張

### データモデル

- 変更なし（ディープリンク URL マッピングは環境変数 or コード内定数で管理。Phase 2 で DB 管理に移行可能）

## Acceptance Criteria

- [ ] AC-09-01: 環境変数 `PORTAL_LAUNCH_MODE=deeplink` の場合、`/api/portal/services/CONNECT_CHAT/launch` がカスタム URL スキーム（`connect-chat://launch?tenant_id=...&user_id=...`）を返し、`is_mock: false` となる
- [ ] AC-09-02: 環境変数 `PORTAL_LAUNCH_MODE=mock`（またはデフォルト）の場合、従来の Mock URL を返し、`is_mock: true` となる
- [ ] AC-09-03: ディープリンク URL に `tenant_id` と `user_id` がクエリパラメータとして含まれる
- [ ] AC-09-04: 契約していないサービスコードでの起動リクエストは 404 エラーが返される（既存動作維持）

## 依存関係

- 前提タスク: Task-04（Portal サービス一覧・起動 Backend PoC 実装）
- 並行実行: Task-06, Task-07, Task-08, Task-13 と並行実行可能

## 実装メモ

- PoC の `is_mock: true` レスポンスは後方互換性のために維持する
- ディープリンク URL のフォーマットはカスタム URL スキーム（`{service}://launch?...`）を採用する
- Phase 2 でユニバーサルリンク（iOS）/ App Links（Android）への移行を検討する
- セキュリティ: ディープリンク URL にトークンは含めない（アプリ側で別途認証する）
