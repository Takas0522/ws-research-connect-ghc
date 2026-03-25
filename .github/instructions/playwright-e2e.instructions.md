---
description: 'Playwright E2E テストの規約。セマンティックロケーター、Web-first アサーション、Page Object Model パターン'
applyTo: 'src/e2e/**/*.ts'
---

# Playwright E2E テスト規約

## ファイル配置

| 種類 | パス | 命名規則 |
|------|------|---------|
| テストファイル | `src/e2e/tests/` | `<feature>.spec.ts` |
| フィクスチャ | `src/e2e/fixtures/` | `seed-<collection>.json` (MongoDB シードデータ) |
| ヘルパー | `src/e2e/helpers/` | `<Page>Page.ts` (Page Object Model) |

## コーディング規約

- **セマンティックロケーター優先**: `getByRole`, `getByLabel`, `getByText` を使用する
- **CSS セレクターや XPath は最終手段**
- **固定待機禁止**: `waitForTimeout` は使用しない
- **Web-first アサーション**: `expect(...).toBeVisible()` 等の自動リトライ付きアサーションで待機する
- **Page Object Model**: 複数テストで共有する操作はページオブジェクトに切り出す
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

### Good Example

```typescript
import { test, expect } from '@playwright/test'

test.describe('ダッシュボード', () => {
  test('ログイン後にダッシュボードが表示される', async ({ page }) => {
    await page.goto('/')

    await test.step('ログインフォームを入力する', async () => {
      await page.getByLabel('メールアドレス').fill('user@example.com')
      await page.getByLabel('パスワード').fill('password')
      await page.getByRole('button', { name: 'ログイン' }).click()
    })

    await test.step('ダッシュボードが表示される', async () => {
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    })
  })
})
```

### Bad Example

```typescript
// 固定待機、CSS セレクター、step なし
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
- テスト前にシードデータを MongoDB に投入し、テスト後にクリーンアップする
- `docs/specs/saas-management-app/system/03-data-model.md` のスキーマに準拠する

## Validation

- テスト実行: `cd src/e2e && npx playwright test`
- 特定テスト: `cd src/e2e && npx playwright test tests/<feature>.spec.ts`
- レポート表示: `cd src/e2e && npx playwright show-report` (ポート 9323)
- UI モード: `cd src/e2e && npx playwright test --ui`
