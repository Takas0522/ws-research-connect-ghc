import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth-helper'
import { DashboardPage } from '../pages/DashboardPage'

test.describe('ダッシュボード', () => {
  test('AC-07-01: ログイン後ダッシュボードに利用量サマリーが表示される', async ({ page }) => {
    const dashboard = new DashboardPage(page)

    await test.step('管理者としてログイン', async () => {
      await loginAsAdmin(page)
    })

    await test.step('ダッシュボードが表示される', async () => {
      await expect(dashboard.heading).toBeVisible()
    })

    await test.step('利用量サマリーセクションが表示される', async () => {
      await expect(dashboard.usageSummaryHeading).toBeVisible()
    })
  })

  test('AC-07-04: 利用目的別サマリーが表示される', async ({ page }) => {
    const dashboard = new DashboardPage(page)

    await test.step('管理者としてログイン', async () => {
      await loginAsAdmin(page)
    })

    await test.step('利用目的別セクションが表示される', async () => {
      await expect(dashboard.heading).toBeVisible()
      // The use case summary section should be visible (even if empty)
      const useCaseSection = page.getByText('利用目的別')
      await expect(useCaseSection).toBeVisible()
    })
  })

  test('AC-07-05: 最終更新日時が表示される', async ({ page }) => {
    const dashboard = new DashboardPage(page)

    await test.step('管理者としてログイン', async () => {
      await loginAsAdmin(page)
    })

    await test.step('最終更新日時が表示される', async () => {
      await expect(dashboard.heading).toBeVisible()
      // LastUpdated component should be present
      const lastUpdatedArea = page.getByText(/最終更新|データなし|未更新/)
      await expect(lastUpdatedArea).toBeVisible()
    })
  })
})
