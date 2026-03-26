# Task-07: Android アプリ一覧・Mock 起動画面

## 概要

テナントが契約しているサービスの一覧画面と、サービス別利用詳細画面、Mock アプリ起動機能を実装する。
PoC フェーズではアプリ起動ボタンをタップすると Mock URL を表示する。

## スコープ

### モバイル（Android）

**API 層:**
- `data/remote/api/ServiceApi.kt` — Retrofit インターフェース（services, usage, launch）
- `data/remote/dto/ServiceDto.kt` — API レスポンス DTO
  - `SubscriptionDto`, `ServiceUsageDetailDto`, `ServiceLaunchDto`

**ドメイン層:**
- `domain/model/Subscription.kt` — 契約サービスモデル
- `domain/repository/PortalRepository.kt` — Repository インターフェース（サービス関連メソッド追加）
- `data/repository/PortalRepositoryImpl.kt` — Repository 実装（サービス関連メソッド追加）

**画面:**
- `ui/services/ServiceListScreen.kt` — サービス一覧画面（アイコン、サービス名、ステータスバッジ、起動ボタン）
- `ui/services/ServiceDetailScreen.kt` — サービス詳細画面（プラン情報、月次利用テーブル、利用推移グラフ）
- `ui/services/ServiceListViewModel.kt` — サービス一覧・詳細の UI 状態管理

**testTag 付与対象:**
- `service_list_heading`
- `service_item_{service_code}`, `service_name_{service_code}`, `service_status_{service_code}`
- `service_launch_button_{service_code}`
- `service_detail_heading`, `service_detail_plan`, `service_detail_usage_table`
- `service_launch_mock_dialog`

### バックエンド

- なし（Task-04 で実装済みの API を使用）

## Acceptance Criteria

- [ ] AC-07-01: サービス一覧画面で、テナントが契約しているサービス（ConnectChat, ConnectMeet, ConnectStore）がカード形式で表示される
- [ ] AC-07-02: 各サービスカードに、サービス名・プラン名・契約ステータス（active/suspended）・起動ボタンが表示される
- [ ] AC-07-03: サービスカードをタップするとサービス詳細画面に遷移し、プラン情報・月次利用テーブル（利用量、利用率、請求額）が表示される
- [ ] AC-07-04: 起動ボタンをタップすると、Mock ダイアログ（「Mock 起動: {service_name}」「URL: {mock_url}」）が表示される
- [ ] AC-07-05: ステータスが `suspended` のサービスは起動ボタンが無効化（グレーアウト）される

## 依存関係

- 前提タスク: Task-04（Services Backend API）、Task-05（Android 基盤 + 認証）
- 並行実行: Task-06, Task-08 と並行実行可能

## 実装メモ

- サービス一覧はボトムナビゲーションの「アプリ」タブからアクセスする
- サービスアイコンは PoC では `service_code` に応じた Material Icons を使用する
  - `CONNECT_CHAT` → `Icons.Default.Chat`
  - `CONNECT_MEET` → `Icons.Default.VideoCall`
  - `CONNECT_STORE` → `Icons.Default.Store`
- Mock アプリ起動は `AlertDialog` で URL を表示するだけ（Phase 1 で `Intent` による deeplink 起動に置換）
- サービス詳細の月次利用テーブルは `LazyColumn` で実装する
- `ServiceListViewModel` で一覧取得と詳細取得の両方を管理する（または `ServiceDetailViewModel` を分離する）
