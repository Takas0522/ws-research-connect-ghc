---
name: playwright-generate-test
description: >-
  Playwright の E2E テストをシナリオ設計からコード生成まで一貫して行うスキル。
  Testcontainers で PostgreSQL を起動し、シナリオ毎にシードデータでリストアして
  Flaky を排除する。src/e2e/tests/ にテストファイルを作成し、実行して通るまで修正する。
  Use when asked to create, generate, or write Playwright tests, E2E tests,
  or integration tests for the web application.
---

# Playwright テスト生成スキル

対象機能の実装を調査し、テストシナリオの設計からコード生成・実行まで一貫して行う。
Testcontainers + スナップショットリストアにより、各シナリオが既知のシードデータ状態で実行される。

## 前提条件

- テストファイルは `src/e2e/tests/` に配置する
- ファイル命名規則: `<feature>.spec.ts`
- `@playwright/test` パッケージを使用する
- baseURL は `http://localhost:5173` (playwright.config.ts で設定済み)
- データベースは Testcontainers (`@testcontainers/postgresql`) で管理する
- Docker が利用可能であること（DevContainer で docker-in-docker 設定済み）

## Testcontainers データ管理の仕組み

```
globalSetup:
  コンテナ起動 → スキーマ適用 → ベースシード投入 → snapshot()

各テスト beforeEach:
  restoreSnapshot() → [シナリオ固有シード投入]

globalTeardown:
  コンテナ停止・破棄
```

- `snapshot()` でベースシードデータ状態を保存する
- `restoreSnapshot()` でシナリオ開始前にクリーンな状態に戻す
- シナリオ固有のデータが必要な場合は、リストア後に追加の SQL を実行する
- コンテナのデータベース名に `"postgres"` を使わない（スナップショット制約）

## ワークフロー

### Step 1: 対象機能の調査（コード）

- フロントエンドの実装 (`src/frontend/src/`) を確認してコンポーネント構造・画面遷移・ユーザー操作を把握する
- バックエンド API のエンドポイント (`src/backend/Program.cs`) を確認し、データフローを理解する
- 既存テスト (`src/e2e/tests/`) のパターンとカバレッジを確認する
- データベーススキーマ (`src/database/init/`) と既存シードデータ (`src/e2e/fixtures/`) を確認する

### Step 2: 対象画面の確認（Playwright CLI）

Playwright CLI を使ってテスト対象の画面を実際にブラウザで開き、要素構造を確認する。
これによりコードだけでは把握しにくい動的な UI 状態やアクセシビリティツリーを正確に把握できる。

```bash
# 対象ページを開く
playwright-cli open http://localhost:5173

# ページのスナップショットを取得して要素の ref を確認する
playwright-cli snapshot

# 特定のページに遷移して確認
playwright-cli goto http://localhost:5173/target-page

# スクリーンショットで視覚的に確認
playwright-cli screenshot
```

スナップショットから以下を把握する:
- 画面に存在する要素の **ref**（要素識別子）とロール・テキスト
- フォーム入力フィールド、ボタン、リンクなどの操作可能な要素
- 動的に生成される要素（API レスポンス後に表示されるテーブル等）
- ローディング状態やエラー状態の表示

必要に応じて操作して画面遷移後の状態も確認する:
```bash
# フォーム入力やボタンクリック後の画面を確認
playwright-cli click <ref>
playwright-cli fill <ref> "テスト入力"
playwright-cli snapshot
```

### Step 3: テストシナリオとシードデータの設計

調査結果をもとに、テストシナリオ **と必要なシードデータ** を一緒に設計する:

- **正常系**: 主要なユーザーフロー（ページ表示、フォーム送信、データ表示など）
- **異常系**: エラー状態（API エラー、バリデーションエラー、空データなど）
- **境界値**: 大量データ、特殊文字入力など
- **UI 状態遷移**: ローディング → 成功/失敗、モーダル開閉、ナビゲーション

シナリオは以下のフォーマットでリスト化する:

```
## <Feature Name> テストシナリオ

| # | シナリオ | シードデータ | ユーザー操作 | 期待結果 | 優先度 |
|---|---------|-----------|------------|---------|-------|
| 1 | 一覧表示 | ベースシード（3件） | 一覧ページにアクセス | 3件のアイテムが表示 | 高 |
| 2 | 空データ | なし（リストア直後） | 一覧ページにアクセス | "データなし"メッセージ | 中 |
| 3 | 新規作成 | ベースシード | フォーム入力→送信 | 4件目が一覧に追加 | 高 |
```

- 各シナリオに必要なシードデータを明示する
- ベースシード（`fixtures/seed.sql`）で足りない場合はシナリオ固有の SQL を設計する
- ユーザーにシナリオの確認・追加・優先度調整を依頼する

### Step 4: シードデータとテストコードの生成

#### シードデータの作成

- ベースシードデータ: `src/e2e/fixtures/seed.sql` — 全シナリオ共通
- シナリオ固有シード: `src/e2e/fixtures/<scenario>.sql` — 特定シナリオ用

```sql
-- fixtures/seed.sql（ベースシードの例）
INSERT INTO samples (id, title, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sample 1', 'Description 1'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Sample 2', 'Description 2'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Sample 3', 'Description 3')
ON CONFLICT DO NOTHING;
```

#### テストコードの生成

以下のルールに従ってテストを生成する:

- `import { test, expect } from '@playwright/test';` を使用
- `test.describe()` でテストをグループ化
- `test.step()` でユーザー操作をグループ化
- シナリオ固有のシードが必要な場合は `beforeEach` 内でスナップショットリストア後に投入
- ユーザー視点のロケーターを優先 (`getByRole`, `getByLabel`, `getByText`)
- 自動リトライ付き Web-first アサーションを使用
- 固定時間の待機 (`waitForTimeout`) は使用しない

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  // beforeEach で DB は自動リストアされている（globalSetup のスナップショット）

  test('Feature - displays items from seed data', async ({ page }) => {
    await page.goto('/');

    await test.step('Verify seeded data is displayed', async () => {
      await expect(page.getByRole('table')).toBeVisible();
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(3);
    });
  });

  test('Feature - handles empty state', async ({ page, request }) => {
    // シナリオ固有: ベースシードのデータを削除して空状態をテスト
    // (restoreSnapshot 後に追加 SQL で状態を変更)

    await page.goto('/');

    await test.step('Verify empty state message', async () => {
      await expect(page.getByText('データがありません')).toBeVisible();
    });
  });
});
```

### Step 5: テストの実行と修正

```bash
cd src/e2e && npx playwright test tests/<feature>.spec.ts
```

- テストが失敗した場合はエラー内容を分析して修正する
- **データ起因の失敗**: シードデータの内容を確認・修正する
- **ロケーター起因の失敗**: Playwright CLI で画面を再確認する
- **タイミング起因の失敗**: 固定待機ではなく適切なアサーション待機に置き換える
- テストが安定して通るまで繰り返す

### Step 6: 最終確認

- テストが意図したシナリオを正しくカバーしているか確認する
- 各シナリオのシードデータが過不足なく定義されているか確認する
- テストを複数回実行して Flaky でないことを確認する
- ロケーターがアクセシブルで特定性があるか確認する
- テスト名が明確にシナリオを表しているか確認する
