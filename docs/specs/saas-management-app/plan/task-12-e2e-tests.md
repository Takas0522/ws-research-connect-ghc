# Task-12: E2E テスト

## 概要

Playwright による E2E テストを構築する。Task-01〜08 の全 Acceptance Criteria をシナリオベースで検証する。
Page Object Model を使用し、Testcontainers MongoDB でテスト用データを管理する。

## スコープ

### テストシナリオ

| テストファイル | 対応タスク | AC カバレッジ |
|---------------|-----------|-------------|
| `auth.spec.ts` | Task-01 | AC-01-01〜04 |
| `product-metrics.spec.ts` | Task-02 | AC-02-01〜06 |
| `plans.spec.ts` | Task-03 | AC-03-01〜04 |
| `customers.spec.ts` | Task-04 | AC-04-01〜04 |
| `contracts.spec.ts` | Task-05 | AC-05-01〜05 |
| `usage-import.spec.ts` | Task-06 | AC-06-01〜05 |
| `dashboard.spec.ts` | Task-07 | AC-07-01〜06 |
| `admin-features.spec.ts` | Task-08 | AC-08-01〜04 |

### Page Object 構成

| ページクラス | 対応画面 |
|-------------|---------|
| `LoginPage` | ログイン画面 |
| `DashboardPage` | ダッシュボード |
| `MasterPage` | マスタ管理（タブ切り替え含む） |
| `ContractsPage` | 契約管理 |
| `ImportPage` | データ取込 |

### テスト基盤

- `global-setup.ts`: Testcontainers MongoDB 起動 + Backend (FastAPI) 起動
- `global-teardown.ts`: コンテナ・プロセス停止
- `helpers/mongodb-helper.ts`: シードデータ投入・クリーンアップ
- `fixtures/seed-*.json`: テスト用シードデータ

## Acceptance Criteria

- [ ] AC-12-01: 認証フロー（ログイン成功・失敗・未認証リダイレクト・ナビ表示）の E2E テストが通る
- [ ] AC-12-02: 製品マスタ CRUD（登録・編集・削除・重複エラー・権限エラー）の E2E テストが通る
- [ ] AC-12-03: メトリクス定義 CRUD の E2E テストが通る
- [ ] AC-12-04: プランマスタ CRUD（メトリクス上限・重複エラー）の E2E テストが通る
- [ ] AC-12-05: 顧客マスタ CRUD の E2E テストが通る
- [ ] AC-12-06: 契約管理（登録・編集・履歴・更新アラート・ステータス・権限）の E2E テストが通る
- [ ] AC-12-07: CSV 取込（アップロード・バリデーション・プレビュー・確定・置換・履歴）の E2E テストが通る
- [ ] AC-12-08: ダッシュボード（サマリ・アラート・トレンド・利用目的・最終更新・権限分離）の E2E テストが通る
- [ ] AC-12-09: 管理者機能（ユーザー管理・無効化・監査ログ・権限）の E2E テストが通る
- [ ] AC-12-10: `npx playwright test` で全テストが PASSED になる

## 依存関係

- 前提タスク: Task-10（バックエンド単体テスト）、Task-11（フロントエンド単体テスト）
- 並行実行: 不可（単体テストで品質担保後に E2E を実施）

## 実装メモ

- 既存の `example.spec.ts` は削除する
- セマンティックロケーター優先: `getByRole`, `getByLabel`, `getByText`
- `test.step()` でユーザー操作をグループ化
- シードデータは `docs/specs/saas-management-app/system/03-data-model.md` に準拠
- Testcontainers で使い捨て MongoDB を使用（DevContainer の 27017 とは別）
- `beforeEach` で `clearAllCollections` → `seedCollection` の順で実行
- 仕様の権限ルール: sales は担当顧客のみ、admin は全顧客
