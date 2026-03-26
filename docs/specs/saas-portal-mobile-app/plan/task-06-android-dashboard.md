# Task-06: Android ダッシュボード画面

## 概要

テナントの利用状況サマリー、月次推移グラフ、利用目的別集計を表示するダッシュボード画面を実装する。
ダッシュボード API（Task-03）からデータを取得し、カード UI + グラフで可視化する。

## スコープ

### モバイル（Android）

**API 層:**
- `data/remote/api/DashboardApi.kt` — Retrofit インターフェース（summary, trends, usage-by-purpose）
- `data/remote/dto/DashboardDto.kt` — API レスポンス DTO
  - `DashboardSummaryDto`, `ServiceUsageSummaryDto`, `UsageTrendDto`, `UsagePurposeDto`

**ドメイン層:**
- `domain/model/DashboardSummary.kt` — ダッシュボードサマリーモデル
- `domain/model/UsageMetric.kt` — サービス利用状況モデル
- `domain/model/UsageTrend.kt` — 月次推移モデル
- `domain/repository/PortalRepository.kt` — Repository インターフェース（ダッシュボード関連メソッド追加）
- `data/repository/PortalRepositoryImpl.kt` — Repository 実装

**画面:**
- `ui/dashboard/DashboardScreen.kt` — ダッシュボードメイン画面（3 状態: Loading / Error / Success）
- `ui/dashboard/DashboardViewModel.kt` — UI 状態管理（`sealed interface DashboardUiState`）
- `ui/dashboard/UsageSummaryCard.kt` — サービス利用状況カード（サービス名、利用量 / 上限、プログレスバー、前月比）
- `ui/dashboard/UsageTrendChart.kt` — 12 ヶ月月次推移グラフ（Compose Canvas または軽量チャートライブラリ）
- `ui/components/UsageBadge.kt` — 利用率バッジ（90% 以上は赤、50〜89% は黄、50% 未満は緑）

**testTag 付与対象:**
- `dashboard_heading`, `dashboard_tenant_name`
- `summary_total_services`, `summary_total_cost`
- `usage_card_{service_code}`, `usage_progress_{service_code}`, `usage_rate_{service_code}`
- `trend_chart_section`
- `purpose_chart_section`

### バックエンド

- なし（Task-03 で実装済みの API を使用）

## Acceptance Criteria

- [ ] AC-06-01: ログイン後にダッシュボード画面が表示され、テナント名・契約サービス数・合計請求額が見える
- [ ] AC-06-02: 各サービスの利用状況カードに、サービス名・利用量 / 上限・プログレスバー・前月比変化率が表示される
- [ ] AC-06-03: 利用率 90% 以上のサービスは赤色、50〜89% は黄色、50% 未満は緑色のバッジが表示される
- [ ] AC-06-04: 画面をスクロールすると月次推移グラフ（12 ヶ月分の利用量推移）が表示される
- [ ] AC-06-05: API 呼び出しが失敗した場合、エラーメッセージとリトライボタンが表示され、リトライボタンをタップするとデータが再取得される

## 依存関係

- 前提タスク: Task-03（Dashboard Backend API）、Task-05（Android 基盤 + 認証）
- 並行実行: Task-07, Task-08 と並行実行可能

## 実装メモ

- `DashboardViewModel` は `init` ブロックで `loadDashboard()` を呼び出し、画面表示時に自動的にデータを取得する
- 利用状況カードはタップするとサービス詳細画面（Task-07）に遷移する（`onServiceClick` コールバック）
- 月次推移グラフは PoC では Compose Canvas でシンプルな折れ線グラフを描画する
- 利用目的別集計は円グラフまたはリスト表示（PoC ではリスト表示で可）
- Pull-to-refresh（`SwipeRefresh`）で手動リフレッシュ可能にする
- `UsageSummaryCard` の前月比は `▲ +12%` / `▼ -5%` の形式で、増加は赤、減少は緑で表示する
