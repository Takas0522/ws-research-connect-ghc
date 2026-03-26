import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'

test.describe('認証', () => {
  test('AC-01-01: 管理者が正しい資格情報でログインするとダッシュボードにリダイレクトされる', async ({ page }) => {
    const loginPage = new LoginPage(page)
    const dashboard = new DashboardPage(page)

    await test.step('ログインページに移動する', async () => {
      await loginPage.goto()
      await expect(loginPage.heading).toBeVisible()
    })

    await test.step('管理者の資格情報でログインする', async () => {
      await loginPage.login('admin@example.com', 'admin123')
    })

    await test.step('ダッシュボードが表示される', async () => {
      await expect(dashboard.heading).toBeVisible()
    })
  })

  test('AC-01-02: 誤ったパスワードでログインするとエラーメッセージが表示される', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await test.step('ログインページに移動する', async () => {
      await loginPage.goto()
    })

    await test.step('誤ったパスワードでログインを試みる', async () => {
      await loginPage.login('admin@example.com', 'wrongpassword')
    })

    await test.step('エラーメッセージが表示される', async () => {
      await expect(loginPage.errorMessage).toBeVisible()
      await expect(loginPage.errorMessage).toContainText('メールアドレスまたはパスワードが正しくありません')
    })
  })

  test('AC-01-03: 未認証ユーザーがダッシュボードにアクセスするとログインページにリダイレクトされる', async ({ page }) => {
    await test.step('ダッシュボードに直接アクセスする', async () => {
      await page.goto('/')
    })

    await test.step('ログインページにリダイレクトされる', async () => {
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test('AC-01-04: ログイン後にナビゲーションに4つのメニュー項目が表示される', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await test.step('管理者としてログインする', async () => {
      await loginPage.goto()
      await loginPage.login('admin@example.com', 'admin123')
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    })

    await test.step('ナビゲーションに4つのメニュー項目が表示される', async () => {
      await expect(page.getByRole('link', { name: 'ダッシュボード' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'マスタ管理' })).toBeVisible()
      await expect(page.getByRole('link', { name: '契約管理' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'データ取込' })).toBeVisible()
    })
  })

  test('ログアウトするとログインページに戻る', async ({ page }) => {
    const loginPage = new LoginPage(page)

    await test.step('管理者としてログインする', async () => {
      await loginPage.goto()
      await loginPage.login('admin@example.com', 'admin123')
      await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
    })

    await test.step('ログアウトする', async () => {
      await page.getByRole('button', { name: 'ログアウト' }).click()
    })

    await test.step('ログインページに戻る', async () => {
      await expect(loginPage.heading).toBeVisible()
    })
  })
})
