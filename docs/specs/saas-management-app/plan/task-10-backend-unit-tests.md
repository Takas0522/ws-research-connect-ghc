# Task-10: バックエンド単体テスト

## 概要

全サービス・ルーターに対する pytest + httpx.AsyncClient の単体テストを構築する。
Task-01〜08 の Acceptance Criteria をバックエンド観点でカバーする。

## スコープ

### テスト対象

| サービス | テスト内容 | 対応タスク |
|----------|-----------|-----------|
| `auth` (router) | ログイン成功/失敗、トークン検証、me エンドポイント | Task-01 |
| `product_service` | 製品 CRUD、重複コード検証、論理削除 | Task-02 |
| `metrics_definition_service` | メトリクス CRUD、重複 (product_id, metric_code) 検証 | Task-02 |
| `plan_service` | プラン CRUD、メトリクス上限設定、重複コード検証 | Task-03 |
| `customer_service` | 顧客 CRUD、重複コード検証、担当営業設定 | Task-04 |
| `contract_service` | 契約 CRUD、ステータス管理、変更履歴記録、権限チェック | Task-05 |
| `import_service` | CSV アップロード、バリデーション、プレビュー、確定、置換 | Task-06 |
| `dashboard_service` | 利用状況サマリ、超過アラート、トレンド、利用目的別集計 | Task-07 |
| `user_service` | ユーザー CRUD、無効化、ロール管理 | Task-08 |
| `audit_service` | 監査ログ記録・取得 | Task-08 |

### テスト方針

- `httpx.AsyncClient` + `ASGITransport` でエンドポイントテスト
- テスト用 MongoDB（テスト前にクリーンアップ）
- 認証が必要なエンドポイントは conftest のトークンフィクスチャを使用
- ホワイトボックス（正常系）+ ブラックボックス（異常系・境界値）の両方

## Acceptance Criteria

- [ ] AC-10-01: 認証エンドポイント（トークン取得・me）のテストが通る
- [ ] AC-10-02: 製品 CRUD（作成・一覧・更新・削除・重複エラー）のテストが通る
- [ ] AC-10-03: メトリクス定義 CRUD のテストが通る
- [ ] AC-10-04: プラン CRUD（メトリクス上限含む）のテストが通る
- [ ] AC-10-05: 顧客 CRUD のテストが通る
- [ ] AC-10-06: 契約 CRUD（ステータス管理・変更履歴・権限）のテストが通る
- [ ] AC-10-07: CSV 取込（バリデーション・プレビュー・確定・置換）のテストが通る
- [ ] AC-10-08: ダッシュボード集計（サマリ・アラート・トレンド）のテストが通る
- [ ] AC-10-09: ユーザー管理・監査ログのテストが通る
- [ ] AC-10-10: `uv run pytest` で全テストが PASSED になる

## 依存関係

- 前提タスク: Task-09（テスト基盤構築）
- 並行実行: Task-11（フロントエンド単体テスト）と並行可能

## 実装メモ

- テストファイル配置: `src/backend/tests/test_<service>.py`
- conftest.py のフィクスチャ: `test_db`, `admin_token`, `sales_token`, `test_client`
- テスト間の独立性: 各テストで DB クリーンアップ
- 仕様準拠: `docs/specs/saas-management-app/system/03-data-model.md` のスキーマに従う
