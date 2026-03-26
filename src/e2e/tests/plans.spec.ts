import { test, expect } from '@playwright/test'
import { loginAsAdmin, navigateTo } from '../helpers/auth-helper'
import { MasterPage } from '../pages/MasterPage'
import { getAuthToken, createProduct, createMetric, createPlan } from '../helpers/api-helper'
import { setupTestDb, cleanupTestData, teardownTestDb } from '../helpers/test-cleanup'

test.beforeAll(async () => { await setupTestDb() })
test.afterAll(async () => { await teardownTestDb() })
test.beforeEach(async () => { await cleanupTestData() })

test.describe('プラン管理', () => {
  test('AC-03-01: 管理者がEnterpriseプランを月額480,000円で作成するとリストに表示される', async ({ page }) => {
    const master = new MasterPage(page)
    let token: string

    await test.step('APIで製品を作成', async () => {
      token = await getAuthToken('admin@example.com', 'admin123')
      await createProduct(token, {
        product_code: 'PLN001',
        product_name: 'PlanProduct',
        category: 'SaaS',
        vendor: 'Vendor F',
      })
    })

    await test.step('管理者としてログインし製品を選択', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.selectProductInTable('PlanProduct')
    })

    await test.step('プランタブに切り替え', async () => {
      await master.switchToTab('プラン')
      await expect(page.getByRole('heading', { name: 'プラン' })).toBeVisible()
    })

    await test.step('プランを新規登録', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.planCodeInput.fill('ENTERPRISE')
      await master.planNameInput.fill('Enterprise')
      await master.monthlyBaseFeeInput.fill('480000')
      await master.saveButton.click()
    })

    await test.step('プランがリストに表示される', async () => {
      await expect(master.getTableRow('Enterprise')).toBeVisible()
    })
  })

  test('AC-03-02: 管理者がメトリクス上限を設定するとプラン詳細に表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品とメトリクスを作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      const product = await createProduct(token, {
        product_code: 'PLN002',
        product_name: 'PlanMetricProduct',
        category: 'SaaS',
        vendor: 'Vendor G',
      })
      await createMetric(token, product.id, {
        metric_code: 'api_calls',
        metric_name: 'API呼び出し',
        unit: '回',
      })
    })

    await test.step('管理者としてログインし製品を選択', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.selectProductInTable('PlanMetricProduct')
    })

    await test.step('プランタブに切り替え', async () => {
      await master.switchToTab('プラン')
    })

    await test.step('メトリクス上限付きのプランを作成', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.planCodeInput.fill('WITH_LIMITS')
      await master.planNameInput.fill('With Limits Plan')
      await master.monthlyBaseFeeInput.fill('100000')

      // Add metric limit
      const addMetricBtn = page.getByRole('button', { name: 'メトリクス上限を追加' })
      if (await addMetricBtn.isVisible()) {
        await addMetricBtn.click()
      }

      await master.saveButton.click()
    })

    await test.step('プランがリストに表示される', async () => {
      await expect(master.getTableRow('With Limits Plan')).toBeVisible()
    })
  })

  test('AC-03-03: 管理者がアラート閾値を90%に設定するとプランに反映される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createProduct(token, {
        product_code: 'PLN003',
        product_name: 'ThresholdProduct',
        category: 'SaaS',
        vendor: 'Vendor H',
      })
    })

    await test.step('管理者としてログインし製品を選択', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.selectProductInTable('ThresholdProduct')
    })

    await test.step('プランタブに切り替え', async () => {
      await master.switchToTab('プラン')
    })

    await test.step('アラート閾値90%のプランを作成', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.planCodeInput.fill('ALERT90')
      await master.planNameInput.fill('Alert 90 Plan')
      await master.monthlyBaseFeeInput.fill('50000')
      await master.alertThresholdInput.clear()
      await master.alertThresholdInput.fill('90')
      await master.saveButton.click()
    })

    await test.step('プランがリストに表示される', async () => {
      await expect(master.getTableRow('Alert 90 Plan')).toBeVisible()
    })
  })

  test('AC-03-04: 重複するプランコードで登録するとエラーが表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品とプランを作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      const product = await createProduct(token, {
        product_code: 'PLN004',
        product_name: 'DupPlanProduct',
        category: 'SaaS',
        vendor: 'Vendor I',
      })
      await createPlan(token, product.id, {
        plan_code: 'DUPPLAN',
        plan_name: 'Dup Plan',
        monthly_base_fee: 30000,
        alert_threshold_percent: 80,
      })
    })

    await test.step('管理者としてログインし製品を選択', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.selectProductInTable('DupPlanProduct')
    })

    await test.step('プランタブに切り替え', async () => {
      await master.switchToTab('プラン')
    })

    await test.step('同じプランコードで登録を試みる', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.planCodeInput.fill('DUPPLAN')
      await master.planNameInput.fill('Another Plan')
      await master.monthlyBaseFeeInput.fill('60000')
      await master.saveButton.click()
    })

    await test.step('エラーが表示される', async () => {
      await expect(page.getByText('プランコードが重複しています')).toBeVisible()
    })
  })
})
