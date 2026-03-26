# Task-06: 従量データ取込

## 概要

月次の従量課金データを CSV でアップロードし、バリデーション → プレビュー → 確定の
フローで取り込む機能を実装する。同一月の再取込は置換として扱い、取込履歴を管理する。

## スコープ

### バックエンド
- `app/schemas/monthly_usage.py` — MonthlyUsageResponse
- `app/schemas/usage_import.py` — ImportPreviewResponse, ImportConfirmRequest, UsageImportResponse
- `app/services/import_service.py` — CSV パース、バリデーション、プレビュー生成、確定処理、置換処理
- `app/routers/imports.py` — `POST /api/imports/upload`, `POST /api/imports/{id}/confirm`, `GET /api/imports`（取込履歴）

### フロントエンド
- `pages/ImportPage.tsx` — 従量データ取込ページ
- `components/Import/FileUpload.tsx` — ドラッグ&ドロップ / ファイル選択
- `components/Import/ImportPreview.tsx` — プレビュー画面（件数・差分・エラー表示）
- `components/Import/ImportHistory.tsx` — 取込履歴一覧
- `hooks/useImport.ts` — 取込フローの状態管理
- `api/imports.ts` — 取込 API クライアント
- `types/api.ts` に MonthlyUsage, UsageImport 型を追加

### データモデル
- `monthly_usage` コレクション — `(contract_id, billing_month, metric_code)` ユニーク
- `usage_imports` コレクション — `(billing_month, status)` インデックス

### CSV フォーマット（想定）
```
customer_code,product_code,billing_month,metric_code,actual_value
CUST001,CRM001,2026-03,api_calls,9500
CUST001,CRM001,2026-03,storage_gb,45
```

## Acceptance Criteria

- [ ] AC-06-01: 営業担当者が 10 件の月次実績 CSV をアップロードすると、プレビュー画面に 10 件のデータと対象月が表示される
- [ ] AC-06-02: マスタに存在しない顧客コード「INVALID001」を含む CSV をアップロードすると、バリデーションエラーが表示され、保存されない
- [ ] AC-06-03: プレビュー確認後に「確定」ボタンを押すと、データが monthly_usage に保存され、取込履歴に「成功」が記録される
- [ ] AC-06-04: 同一対象月（2026-03）のデータを再取込すると、置換確認ダイアログが表示され、確定後に既存データが置換される
- [ ] AC-06-05: 取込履歴一覧で過去の取込結果（成功・失敗・ファイル名・実行者・日時）が確認できる

## 依存関係
- 前提タスク: Task-05（契約管理 — contract_id, customer_id, product_id の参照先が必要）
- 並行実行: 不可（Task-05 完了後に開始）

## 実装メモ
- CSV バリデーション: customer_code × product_code → contracts マスタ突合、billing_month 形式チェック、metric_code 存在チェック、actual_value 数値チェック
- `usage_rate` = `actual_value / limit_value_snapshot` をサーバー側で自動計算
- `limit_value_snapshot` は確定時点の plans.metric_limits から取得
- `overage_count` = max(0, actual_value - limit_value_snapshot)
- `overage_fee` = overage_count × overage_unit_price
- 同一月の再取込は `replace_mode = true`。旧 monthly_usage を削除 → 新規挿入
- CSV アップロード上限は 10MB（仕様 01-architecture.md）
- 取込失敗時は `usage_imports.status = failed` として履歴に記録
