# Task-12: iOS アプリ一覧・ディープリンク起動画面

## 概要

テナントが契約しているサービスの一覧画面と、サービス別利用詳細画面、ディープリンクによるアプリ起動機能を SwiftUI で実装する。
Phase 1 では PoC の Mock 起動をディープリンク起動に置き換える。

## スコープ

### モバイル（iOS）

**サービス層追加:**
- `Services/PortalService.swift` に以下を追加:
  - `getSubscriptions()` → `[Subscription]`
  - `getServiceUsage(serviceCode:)` → `ServiceUsageDetail`
  - `launchService(serviceCode:)` → `ServiceLaunchResult`

**モデル:**
- `Models/Subscription.swift` — 契約サービスモデル（Codable）
- `Models/ServiceUsageDetail.swift` — サービス利用詳細モデル（Codable）
- `Models/ServiceLaunchResult.swift` — 起動結果モデル（launch_url, is_mock）

**画面:**
- `Views/Services/ServiceListView.swift` — サービス一覧画面（アイコン、サービス名、ステータスバッジ、起動ボタン）
- `Views/Services/ServiceDetailView.swift` — サービス詳細画面（プラン情報、月次利用テーブル、Swift Charts グラフ）
- `ViewModels/ServiceListViewModel.swift` — サービス一覧・詳細の UI 状態管理

**ディープリンク起動:**
- `UIApplication.shared.open(url)` でカスタム URL スキームを開く
- `is_mock: true` の場合はアラートで Mock URL を表示（PoC 後方互換）
- `is_mock: false` の場合は直接ディープリンクを開く

**accessibilityIdentifier 付与対象:**
- `service_list_heading`
- `service_item_{service_code}`, `service_name_{service_code}`, `service_status_{service_code}`
- `service_launch_button_{service_code}`
- `service_detail_heading`, `service_detail_plan`, `service_detail_usage_table`

### バックエンド

- なし（Task-04 + Task-09 で実装済みの API を使用）

## Acceptance Criteria

- [ ] AC-12-01: サービス一覧画面（アプリタブ）で、テナントが契約しているサービスがカード形式で表示される
- [ ] AC-12-02: 各サービスカードに、サービス名・プラン名・契約ステータス・起動ボタンが表示される
- [ ] AC-12-03: サービスカードをタップするとサービス詳細画面に遷移し、プラン情報・月次利用テーブル（利用量、利用率、請求額）が表示される
- [ ] AC-12-04: 起動ボタンをタップすると、Backend から取得したディープリンク URL でアプリ起動を試みる（`is_mock: false` の場合）。`is_mock: true` の場合はアラートで Mock URL を表示する
- [ ] AC-12-05: ステータスが `suspended` のサービスは起動ボタンが無効化（グレーアウト）される

## 依存関係

- 前提タスク: Task-09（Backend ディープリンク対応）、Task-10（iOS 基盤 + 認証）
- 並行実行: Task-11, Task-13 と並行実行可能

## 実装メモ

- サービスアイコンは `service_code` に応じた SF Symbols を使用する
  - `CONNECT_CHAT` → `message.fill`
  - `CONNECT_MEET` → `video.fill`
  - `CONNECT_STORE` → `storefront.fill`
- ディープリンク起動は `UIApplication.shared.canOpenURL(url)` で事前チェックし、開けない場合は App Store や Web 版へのフォールバックを案内する
- サービス詳細の月次利用テーブルは `List` + `Section` で実装する
- `NavigationStack` + `NavigationLink` で一覧 → 詳細の遷移を実装する
