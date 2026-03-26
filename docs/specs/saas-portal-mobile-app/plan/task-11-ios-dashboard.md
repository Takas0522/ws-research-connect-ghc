# Task-11: iOS ダッシュボード画面

## 概要

テナントの利用状況サマリー、月次推移グラフ、利用目的別集計を表示するダッシュボード画面を SwiftUI で実装する。
グラフ描画には Swift Charts を使用する。

## スコープ

### モバイル（iOS）

**サービス層:**
- `Services/PortalService.swift` — ポータル API 呼び出し（ProtocolベースのPortalServiceProtocol）
  - `getDashboardSummary()` → `DashboardSummary`
  - `getUsageTrends()` → `[UsageTrend]`
  - `getUsageByPurpose()` → `[UsagePurpose]`

**モデル:**
- `Models/DashboardSummary.swift` — ダッシュボードサマリーモデル（Codable）
- `Models/UsageMetric.swift` — サービス利用状況モデル（Codable）
- `Models/UsageTrend.swift` — 月次推移モデル（Codable）

**画面:**
- `Views/Dashboard/DashboardView.swift` — ダッシュボードメイン画面（3 状態: Loading / Error / Success）
- `ViewModels/DashboardViewModel.swift` — UI 状態管理（`@Observable`, `DashboardUiState` enum）
- `Views/Dashboard/UsageSummaryCard.swift` — サービス利用状況カード（サービス名、利用量 / 上限、ProgressView、前月比）
- `Views/Dashboard/UsageTrendChart.swift` — 12 ヶ月月次推移グラフ（Swift Charts `Chart` + `LineMark`）
- `Views/Components/UsageBadge.swift` — 利用率バッジ（90% 以上は赤、50〜89% は黄、50% 未満は緑）

**accessibilityIdentifier 付与対象:**
- `dashboard_heading`, `dashboard_tenant_name`
- `summary_total_services`, `summary_total_cost`
- `usage_card_{service_code}`, `usage_progress_{service_code}`, `usage_rate_{service_code}`
- `trend_chart_section`
- `purpose_section`

### バックエンド

- なし（Task-03 で実装済みの API を使用）

## Acceptance Criteria

- [ ] AC-11-01: ログイン後にダッシュボードタブが表示され、テナント名・契約サービス数・合計請求額が見える
- [ ] AC-11-02: 各サービスの利用状況カードに、サービス名・利用量 / 上限・ProgressView・前月比変化率が表示される
- [ ] AC-11-03: 利用率 90% 以上のサービスは赤色、50〜89% は黄色、50% 未満は緑色のバッジが表示される
- [ ] AC-11-04: 画面をスクロールすると Swift Charts による月次推移グラフ（12 ヶ月分の利用量推移）が表示される
- [ ] AC-11-05: API 呼び出しが失敗した場合、エラーメッセージとリトライボタンが表示され、リトライボタンをタップするとデータが再取得される

## 依存関係

- 前提タスク: Task-03（Dashboard Backend API）、Task-10（iOS 基盤 + 認証）
- 並行実行: Task-12, Task-13 と並行実行可能

## 実装メモ

- `DashboardViewModel` は `.task` モディファイアで画面表示時にデータ取得する
- Swift Charts の `Chart` ビュー内で `LineMark` を使用して折れ線グラフを描画する
- 利用状況カードはタップするとサービス詳細（Task-12）に遷移する
- Pull-to-refresh は `.refreshable` モディファイアで実装する
- `UsageSummaryCard` の前月比は `▲ +12%` / `▼ -5%` の形式で表示する
- Protocol ベース（`PortalServiceProtocol`）でテスタビリティを確保する
- `#Preview` で `UsageMetric.preview` フィクスチャを使用する
