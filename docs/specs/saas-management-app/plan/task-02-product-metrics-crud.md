# Task-02: 製品マスタ・メトリクス定義 CRUD

## 概要

SaaS 製品の基本情報とメトリクス定義（従量課金指標）の CRUD を実装する。
マスタ管理画面のタブ構成を構築し、製品タブとメトリクスタブを提供する。

## スコープ

### バックエンド
- `app/schemas/product.py` — ProductCreate, ProductUpdate, ProductResponse
- `app/schemas/metrics_definition.py` — MetricsDefinitionCreate, MetricsDefinitionUpdate, MetricsDefinitionResponse
- `app/services/product_service.py` — 製品の CRUD（is_active による論理削除）
- `app/services/metrics_definition_service.py` — メトリクス定義の CRUD
- `app/routers/products.py` — `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`
- `app/routers/metrics_definitions.py` — `GET/POST /api/products/{product_id}/metrics`, `GET/PUT/DELETE /api/metrics-definitions/{id}`

### フロントエンド
- `pages/MasterPage.tsx` — マスタ管理ページ（タブ切り替え構成）
- `components/Master/ProductTab.tsx` — 製品一覧・登録・編集・削除
- `components/Master/ProductForm.tsx` — 製品登録/編集フォーム（モーダル）
- `components/Master/MetricsTab.tsx` — メトリクス定義一覧・登録・編集・削除
- `components/Master/MetricsForm.tsx` — メトリクス定義登録/編集フォーム（モーダル）
- `hooks/useProducts.ts` — 製品データフェッチ
- `hooks/useMetricsDefinitions.ts` — メトリクス定義データフェッチ
- `api/products.ts` — 製品 API クライアント
- `api/metricsDefinitions.ts` — メトリクス定義 API クライアント
- `types/api.ts` に Product, MetricsDefinition 型を追加

### データモデル
- `products` コレクション — `product_code` ユニーク
- `metrics_definitions` コレクション — `(product_id, metric_code)` ユニーク

## Acceptance Criteria

- [ ] AC-02-01: 管理者が製品コード「CRM001」・製品名「CloudCRM Pro」・カテゴリ「CRM」・ベンダー「Cloud Corp」を登録すると、製品一覧に表示される
- [ ] AC-02-02: 管理者が既存製品の製品名を「CloudCRM Pro v2」に編集すると、一覧に更新された名前が表示される
- [ ] AC-02-03: 管理者が製品を削除（無効化）すると、一覧に表示されなくなる
- [ ] AC-02-04: 既に登録済みの製品コード「CRM001」で再度登録しようとすると、エラーメッセージが表示される
- [ ] AC-02-05: 管理者が製品「CloudCRM Pro」にメトリクス定義「api_calls」（表示名: API呼出数、単位: 回）を登録すると、メトリクス一覧に表示される
- [ ] AC-02-06: 営業担当者（sales ロール）がマスタ管理画面にアクセスすると、権限エラーが表示される

## 依存関係
- 前提タスク: Task-01（認証基盤）
- 並行実行: Task-04, Task-08 と並行可能

## 実装メモ
- 製品の削除は物理削除ではなく `is_active = false` の論理無効化（仕様 03-data-model.md）
- マスタ管理画面は admin ロール専用（仕様 04-auth-and-operations.md）
- メトリクス定義は製品に紐づく（product_id）。同一製品内での metric_code 重複不可
- 製品一覧はアクティブなもののみ表示。無効化されたものは非表示
