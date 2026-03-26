# Task-07: ダッシュボード

## 概要

営業担当者のメイン画面として、顧客別の利用状況サマリ・超過アラート・月次トレンドグラフ・
利用目的別サマリを表示するダッシュボードを実装する。

## スコープ

### バックエンド
- `app/services/dashboard_service.py` — ダッシュボード集計ロジック（利用率計算、超過判定、トレンドデータ、利用目的集計）
- `app/routers/dashboard.py` — `GET /api/dashboard/summary`, `GET /api/dashboard/alerts`, `GET /api/dashboard/trend/{customer_id}`, `GET /api/dashboard/use-case-summary`

### フロントエンド
- `pages/DashboardPage.tsx` — ダッシュボードページ
- `components/Dashboard/UsageSummaryCard.tsx` — 顧客別利用率カード
- `components/Dashboard/AlertList.tsx` — 超過アラート一覧
- `components/Dashboard/TrendChart.tsx` — 月次トレンドグラフ（Recharts LineChart）
- `components/Dashboard/UseCaseSummary.tsx` — 利用目的別サマリ（Recharts PieChart/BarChart）
- `components/Dashboard/LastUpdated.tsx` — 最終更新日時表示
- `hooks/useDashboard.ts` — ダッシュボードデータフェッチ
- `api/dashboard.ts` — ダッシュボード API クライアント

### データモデル
- `monthly_usage`, `contracts`, `plans`, `customers` を集計クエリで参照
- 新規コレクションは不要（既存データの集計表示）

## Acceptance Criteria

- [ ] AC-07-01: 営業担当者がログイン後にダッシュボードが表示され、担当顧客の利用状況サマリ（顧客名・製品名・利用率）が一覧表示される
- [ ] AC-07-02: プラン閾値 90% を超えた顧客に超過アラートバッジ（赤色）が表示され、アラート一覧にも表示される
- [ ] AC-07-03: 顧客を選択すると、直近 12 ヶ月の月次トレンドグラフが Recharts の LineChart で表示される
- [ ] AC-07-04: 利用目的別（sales_ops, customer_support, analytics 等）の件数・利用量サマリが表示される
- [ ] AC-07-05: ダッシュボードに最終更新日時（最新の usage_imports.confirmed_at）が表示される
- [ ] AC-07-06: 管理者は全顧客のサマリが表示され、営業担当者は担当顧客のサマリのみが表示される

## 依存関係
- 前提タスク: Task-06（従量データ取込 — monthly_usage データが必要）
- 並行実行: 不可（Task-06 完了後に開始）

## 実装メモ
- 利用率 = `actual_value / limit_value_snapshot × 100`（monthly_usage に保存済み）
- 超過アラートの閾値は `plans.alert_threshold_pct`（デフォルト 90%）
- グラフ対象メトリクスは Phase 1 では `api_calls` を優先（仕様 02-screen-design.md）
- データ欠損月は 0 または未取込として表示し、グラフが途切れないようにする
- Recharts で `ResponsiveContainer` + `LineChart` を使用
- primary_use_case のラベルは日本語変換する（sales_ops → 営業支援、等）
- ダッシュボード初期表示は P95 2 秒以内が目標（仕様 01-architecture.md）
- 営業担当者のフィルタは `customers.assigned_sales_user_id` で API 側で制御
