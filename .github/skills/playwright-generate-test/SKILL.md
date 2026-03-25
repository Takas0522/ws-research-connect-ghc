---
name: playwright-generate-test
description: >-
  Playwright E2E テストをシナリオ設計からコード生成・実行まで一貫して行うスキル。
  MongoDB のシードデータで各テストの初期状態を管理し、Flaky を排除する。
  src/e2e/tests/ にテストファイルを作成し、通るまで修正する。
  Use when asked to create, generate, or write Playwright tests, E2E tests,
  or integration tests for the SaaS management web application.
---

# Playwright テスト生成スキル

対象機能の実装を調査し、テストシナリオの設計からコード生成・実行まで一貫して行う。
MongoDB シードデータ管理により、各シナリオが既知のデータ状態で実行される。

## When to Use This Skill

- 新しい画面・機能の **E2E テスト** を作成するとき
- 既存テストに **テストケースを追加** するとき
- **リグレッションテスト** を強化するとき
- **テストシナリオ設計** からコード生成までを一括で行いたいとき

## Prerequisites

- テストファイルは `src/e2e/tests/` に配置する
- ファイル命名規則: `<feature>.spec.ts`
- `@playwright/test` パッケージを使用する
- baseURL: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- MongoDB: `mongodb://localhost:27017/saas_management`
- Frontend (`npm run dev`) と Backend (`uvicorn`) が起動済みであること

## MongoDB シードデータ管理

```
テスト実行前:
  MongoDB 接続 → テスト用コレクションをクリア → ベースシードデータ投入

各テスト beforeEach:
  コレクションクリア → ベースシードデータ再投入 → [シナリオ固有データ追加]

テスト実行後:
  テスト用データのクリーンアップ
```

- ベースシードデータ: `src/e2e/fixtures/seed-<collection>.json`
- シナリオ固有データ: API 経由で投入するか、追加の JSON ファイルを用意する
- `docs/specs/saas-management-app/system/03-data-model.md` のスキーマに準拠する

## Workflow

### TODO
- [ ] Step 1: 対象機能の調査 — コードと画面を確認
- [ ] Step 2: 対象画面の確認 — Playwright CLI で要素構造を把握
- [ ] Step 3: テストシナリオとシードデータの設計
- [ ] Step 4: シードデータとテストコードの生成
- [ ] Step 5: テストの実行と修正
- [ ] Step 6: 最終確認 — Flaky チェック

### Step 1: 対象機能の調査（コード）

- フロントエンドの実装 (`src/frontend/src/`) を確認してコンポーネント構造・画面遷移・ユーザー操作を把握する
- バックエンド API のエンドポイント (`src/backend/main.py`, `src/backend/app/routers/`) を確認し、データフローを理解する
- 既存テスト (`src/e2e/tests/`) のパターンとカバレッジを確認する
- データモデル (`docs/specs/saas-management-app/system/03-data-model.md`) と既存シードデータ (`src/e2e/fixtures/`) を確認する

### Step 2: 対象画面の確認（Playwright CLI）

Playwright CLI を使ってテスト対象の画面を実際にブラウザで開き、要素構造を確認する。

```bash
playwright-cli open http://localhost:5173
playwright-cli snapshot
playwright-cli goto http://localhost:5173/target-page
playwright-cli screenshot
```

スナップショットから以下を把握する:
- 画面に存在する要素の **ref**（要素識別子）とロール・テキスト
- フォーム入力フィールド、ボタン、リンクなどの操作可能な要素
- 動的に生成される要素（API レスポンス後に表示されるテーブル等）
- ローディング状態やエラー状態の表示

### Step 3: テストシナリオとシードデータの設計

調査結果をもとにシナリオ **と必要なシードデータ** を一緒に設計する:

- **正常系**: 主要なユーザーフロー（ページ表示、フォーム送信、データ表示）
- **異常系**: エラー状態（API エラー、バリデーションエラー、空データ）
- **境界値**: 大量データ、特殊文字入力
- **UI 状態遷移**: ローディング → 成功/失敗、モーダル開閉

シナリオフォーマット:

```
| # | シナリオ | シードデータ | ユーザー操作 | 期待結果 | 優先度 |
|---|---------|-----------|------------|---------|-------|
| 1 | 一覧表示 | seed-products.json (3件) | 一覧ページにアクセス | 3件表示 | 高 |
| 2 | 空データ | なし | 一覧ページにアクセス | "データなし" | 中 |
| 3 | 新規作成 | seed-products.json | フォーム入力→送信 | 4件目追加 | 高 |
```

### Step 4: シードデータとテストコードの生成

#### シードデータ (JSON)

```json
// fixtures/seed-products.json
[
  {
    "product_code": "CRM001",
    "product_name": "CloudCRM Pro",
    "category": "CRM",
    "vendor": "CloudCRM Inc.",
    "created_at": { "$date": "2026-01-01T00:00:00Z" },
    "updated_at": { "$date": "2026-01-01T00:00:00Z" }
  },
  {
    "product_code": "SYNC001",
    "product_name": "DataSync Hub",
    "category": "データ同期",
    "vendor": "DataSync Corp.",
    "created_at": { "$date": "2026-01-01T00:00:00Z" },
    "updated_at": { "$date": "2026-01-01T00:00:00Z" }
  }
]
```

#### テストコード

```typescript
import { test, expect } from '@playwright/test'

test.describe('製品マスタ', () => {
  test('製品一覧にシードデータが表示される', async ({ page }) => {
    await page.goto('/master')

    await test.step('製品テーブルが表示される', async () => {
      await expect(page.getByRole('table')).toBeVisible()
    })

    await test.step('シードデータの製品が表示される', async () => {
      await expect(page.getByText('CloudCRM Pro')).toBeVisible()
      await expect(page.getByText('DataSync Hub')).toBeVisible()
    })
  })
})
```

### Step 5: テストの実行と修正

```bash
cd src/e2e && npx playwright test tests/<feature>.spec.ts
```

- **データ起因の失敗**: シードデータの内容を確認・修正する
- **ロケーター起因の失敗**: Playwright CLI で画面を再確認する
- **タイミング起因の失敗**: Web-first アサーション (`toBeVisible()` 等) に置き換える

### Step 6: 最終確認

- テストを複数回実行して Flaky でないことを確認する
- ロケーターがセマンティックで特定性があるか確認する
- テスト名が明確にシナリオを表しているか確認する

## Troubleshooting

| 症状 | 原因 | 対処 |
|------|------|------|
| `page.goto` でタイムアウト | Frontend 未起動 | `cd src/frontend && npm run dev` を実行 |
| API レスポンスが 404 | Backend 未起動 or ルーター未登録 | `cd src/backend && uv run uvicorn main:app` を実行 |
| シードデータが反映されない | MongoDB 接続エラー | `mongosh` で接続確認 |
| ロケーターが見つからない | 要素の aria 属性不足 | `playwright-cli snapshot` で要素構造を再確認 |
| テストが Flaky | `waitForTimeout` 使用 or 非同期処理待機不足 | Web-first アサーションに置き換え |
