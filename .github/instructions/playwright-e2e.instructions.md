---
description: 'Playwright E2E テストの規約。Page Object Model、Testcontainers MongoDB、セマンティックロケーター、Web-first アサーション'
applyTo: 'src/e2e/**/*.ts'
---

# Playwright E2E テスト規約

## ファイル配置

| 種類 | パス | 命名規則 |
|------|------|---------|
| テストファイル | `src/e2e/tests/` | `<feature>.spec.ts` |
| Page Object | `src/e2e/pages/` | `<Page>Page.ts`（`BasePage.ts` を継承） |
| フィクスチャ | `src/e2e/fixtures/` | `seed-<collection>.json`（MongoDB シードデータ） |
| ヘルパー | `src/e2e/helpers/` | `<name>-helper.ts` |
| グローバルセットアップ | `src/e2e/global-setup.ts` | Testcontainers MongoDB + Backend 起動 |
| グローバルティアダウン | `src/e2e/global-teardown.ts` | コンテナ・プロセス停止 |

## Testcontainers MongoDB

- テスト実行時は `@testcontainers/mongodb` で **使い捨て MongoDB コンテナ** を起動する
- DevContainer 内の MongoDB（27017）は開発用。テスト用 DB は Testcontainers が動的にポートを割り当てる
- `globalSetup` でコンテナを起動し、接続文字列を `process.env.MONGO_URI` に設定する
- `globalTeardown` でコンテナを停止・破棄する
- Backend (FastAPI) は `MONGO_URI` 環境変数を参照して起動する

## Page Object Model (POM)

- 1 画面 = 1 ページクラス。`src/e2e/pages/` に配置する
- `BasePage` を継承し、`path` プロパティと `goto()` メソッドを共通化する
- ロケーターは **コンストラクタで `readonly` プロパティ** として定義する
- 操作メソッド (`login()`, `submitForm()` 等) は意味のある名前の `async` メソッドにする
- **アサーション (`expect`) はテストファイル側に書く**。ページクラスに `expect` を書かない

## コーディング規約

- **セマンティックロケーター優先**: `getByRole`, `getByLabel`, `getByText` を使用する
- **CSS セレクターや XPath は最終手段**
- **固定待機禁止**: `waitForTimeout` は使用しない
- **Web-first アサーション**: `expect(...).toBeVisible()` 等の自動リトライ付きアサーションで待機する
- `test.describe()` でテストをグループ化する
- `test.step()` でユーザー操作をグループ化する

## ロケーター優先順位

| 優先度 | ロケーター | 例 |
|--------|-----------|-----|
| 1 (推奨) | `getByRole` | `page.getByRole('button', { name: 'ログイン' })` |
| 2 | `getByLabel` | `page.getByLabel('メールアドレス')` |
| 3 | `getByText` | `page.getByText('データがありません')` |
| 4 | `getByTestId` | `page.getByTestId('product-table')` |
| 5 (最終手段) | CSS セレクター | `page.locator('.some-class')` |

## テストパターン

### Good Example（POM + Testcontainers）

```typescript
import { test, expect } from '@playwright/test'
import { type Db } from 'mongodb'
import { connectToTestDb, disconnectTestDb, seedCollection, clearAllCollections } from '../helpers/mongodb-helper'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'

let db: Db

test.beforeAll(async () => {
  db = await connectToTestDb()
})

test.afterAll(async () => {
  await disconnectTestDb()
})

test.describe('ダッシュボード', () => {
  test.beforeEach(async () => {
    await clearAllCollections(db)
    await seedCollection(db, 'users', 'seed-users.json')
  })

  test('ログイン後にダッシュボードが表示される', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dashboard = new DashboardPage(page)

    await test.step('ログインフォームを入力する', async () => {
      await loginPage.goto()
      await loginPage.login('user@example.com', 'password')
    })

    await test.step('ダッシュボードが表示される', async () => {
      await expect(dashboard.heading).toBeVisible()
    })
  })
})
```

### Bad Example

```typescript
// ❌ POM 未使用、固定待機、CSS セレクター、step なし、シードデータなし
test('dashboard', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.waitForTimeout(3000)
  await page.locator('#email-input').fill('user@example.com')
  await page.locator('#password-input').fill('password')
  await page.locator('#login-btn').click()
  await page.waitForTimeout(5000)
  const heading = await page.locator('h1').textContent()
  expect(heading).toBe('ダッシュボード')
})
```

## シードデータ管理

- シードデータは JSON 形式で `src/e2e/fixtures/` に配置する
- ファイル名: `seed-<collection>.json`
- Testcontainers MongoDB に対して `beforeEach` でシードデータを投入する（`mongodb-helper.ts` を使用）
- `docs/specs/saas-management-app/system/03-data-model.md` のスキーマに準拠する
- テスト間のデータ独立性を保証するため、`beforeEach` で必ず `clearAllCollections` → `seedCollection` の順で実行する

## Validation

- テスト実行: `cd src/e2e && npx playwright test`
- 特定テスト: `cd src/e2e && npx playwright test tests/<feature>.spec.ts`
- レポート表示: `cd src/e2e && npx playwright show-report` (ポート 9323)
- UI モード: `cd src/e2e && npx playwright test --ui`
