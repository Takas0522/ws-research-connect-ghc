# Task-03: プランマスタ CRUD

## 概要

製品に紐づく課金プランの CRUD を実装する。プラン別の月額基本料・アラート閾値・
メトリクス上限（API 呼出上限・超過単価等）を管理できるようにする。

## スコープ

### バックエンド
- `app/schemas/plan.py` — PlanCreate, PlanUpdate, PlanResponse（metric_limits 含む）
- `app/services/plan_service.py` — プランの CRUD（is_active による論理削除）
- `app/routers/plans.py` — `GET/POST /api/products/{product_id}/plans`, `GET/PUT/DELETE /api/plans/{id}`

### フロントエンド
- `components/Master/PlanTab.tsx` — プラン一覧・登録・編集・削除
- `components/Master/PlanForm.tsx` — プラン登録/編集フォーム（metric_limits の動的追加 UI）
- `hooks/usePlans.ts` — プランデータフェッチ
- `api/plans.ts` — プラン API クライアント
- `types/api.ts` に Plan, MetricLimit 型を追加

### データモデル
- `plans` コレクション — `(product_id, plan_code)` ユニーク
- `metric_limits` は plans ドキュメント内の配列として保持

## Acceptance Criteria

- [ ] AC-03-01: 管理者が製品「CloudCRM Pro」のプラン「Enterprise」を月額基本料 480,000 円で登録すると、プラン一覧に表示される
- [ ] AC-03-02: 管理者がプランにメトリクス上限（metric_code: api_calls, 上限値: 10,000, 超過単価: 50 円）を設定すると、プラン詳細に表示される
- [ ] AC-03-03: 管理者がアラート閾値を 90% に設定すると、プラン詳細に反映される
- [ ] AC-03-04: 同一製品内で重複するプランコード「ENT」で登録しようとすると、エラーメッセージが表示される

## 依存関係
- 前提タスク: Task-02（製品マスタ — product_id の参照先が必要）
- 並行実行: 不可（Task-02 完了後に開始）

## 実装メモ
- `alert_threshold_pct` のデフォルトは 90（仕様 03-data-model.md）
- `metric_limits` 配列には `metric_code`, `limit_value`, `overage_unit_price` を含む
- プラン登録フォームでは metric_limits を動的に行追加できる UI が必要
- `alert_threshold_pct` は 1〜100 の範囲制約（Pydantic Field で制約）
