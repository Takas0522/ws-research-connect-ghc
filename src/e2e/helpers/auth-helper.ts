import { type Page } from '@playwright/test'

const ADMIN_EMAIL = 'admin@example.com'
const ADMIN_PASSWORD = 'admin123'
const SALES_EMAIL = 'sales@example.com'
const SALES_PASSWORD = 'sales123'

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('メールアドレス').fill(email)
  await page.getByLabel('パスワード').fill(password)
  await page.getByRole('button', { name: 'ログイン' }).click()
  await page.waitForURL('/')
  // Wait for dashboard to fully load to ensure auth is complete
  await page.getByRole('heading', { name: 'ダッシュボード' }).waitFor({ state: 'visible' })
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
}

export async function loginAsSales(page: Page): Promise<void> {
  await loginAs(page, SALES_EMAIL, SALES_PASSWORD)
}

export async function navigateTo(page: Page, linkName: string): Promise<void> {
  await page.getByRole('link', { name: linkName }).click()
}

export { ADMIN_EMAIL, ADMIN_PASSWORD, SALES_EMAIL, SALES_PASSWORD }
