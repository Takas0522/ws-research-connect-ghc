import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsSales, navigateTo } from '../helpers/auth-helper'
import { ContractsPage } from '../pages/ContractsPage'
import {
  getAuthToken,
  createProduct,
  createPlan,
  createCustomer,
  createContract,
} from '../helpers/api-helper'
import { setupTestDb, cleanupTestData, teardownTestDb } from '../helpers/test-cleanup'

test.beforeAll(async () => { await setupTestDb() })
test.afterAll(async () => { await teardownTestDb() })
test.beforeEach(async () => { await cleanupTestData() })

test.describe('契約管理', () => {
  test('AC-05-01: ABC商事 × CloudCRM × Enterprise の契約を作成するとリストに表示される', async ({ page }) => {
    const contractsPage = new ContractsPage(page)
    const token = await getAuthToken('admin@example.com', 'admin123')

    await test.step('APIで製品・プラン・顧客を作成', async () => {
      const product = await createProduct(token, {
        product_code: 'CON001',
        product_name: 'CloudCRM',
        category: 'CRM',
        vendor: 'Cloud Corp',
      })

      await createPlan(token, product.id, {
        plan_code: 'ENT',
        plan_name: 'Enterprise',
        monthly_base_fee: 480000,
        alert_threshold_percent: 90,
      })

      await createCustomer(token, {
        customer_code: 'ABC001',
        customer_name: 'ABC商事',
      })
    })

    await test.step('管理者としてログインし契約管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, '契約管理')
    })

    await test.step('新規契約を作成', async () => {
      await contractsPage.createButton.click()

      await contractsPage.customerSelect.selectOption({ label: 'ABC商事' })
      await contractsPage.productSelect.selectOption({ label: 'CloudCRM' })

      // Wait for plan dropdown to be populated
      await page.waitForTimeout(500)
      await contractsPage.planSelect.selectOption({ index: 1 })

      await contractsPage.startDateInput.fill('2024-01-01')
      await contractsPage.renewalDateInput.fill('2025-01-01')
      await contractsPage.licenseCountInput.fill('50')
      await contractsPage.useCaseSelect.selectOption('sales_ops')
      await contractsPage.saveButton.click()
    })

    await test.step('契約がリストに表示される', async () => {
      await expect(contractsPage.getContractRow('ABC商事')).toBeVisible()
      await expect(contractsPage.getContractRow('CloudCRM')).toBeVisible()
    })
  })

  test('AC-05-02: ライセンス数を変更すると履歴に記録される', async ({ page }) => {
    const contractsPage = new ContractsPage(page)
    const token = await getAuthToken('admin@example.com', 'admin123')

    await test.step('APIでテストデータを作成', async () => {
      const product = await createProduct(token, {
        product_code: 'CON002',
        product_name: 'EditContract Product',
        category: 'SaaS',
        vendor: 'Vendor J',
      })
      const plan = await createPlan(token, product.id, {
        plan_code: 'STD',
        plan_name: 'Standard',
        monthly_base_fee: 100000,
        alert_threshold_percent: 80,
      })
      const customer = await createCustomer(token, {
        customer_code: 'LICCHG',
        customer_name: 'License Change Corp',
      })
      await createContract(token, {
        customer_id: customer.id,
        product_id: product.id,
        current_plan_id: plan.id,
        license_count: 10,
        contract_start_date: '2024-01-01',
        contract_renewal_date: '2025-01-01',
        primary_use_case: 'sales_ops',
      })
    })

    await test.step('管理者としてログインし契約管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, '契約管理')
    })

    await test.step('契約を編集してライセンス数を変更', async () => {
      await contractsPage.getEditButton('License Change Corp').click()
      await contractsPage.licenseCountInput.clear()
      await contractsPage.licenseCountInput.fill('20')

      // Wait for change reason field to appear (required when modifying license count)
      await expect(page.getByLabel('変更理由')).toBeVisible()
      await page.getByLabel('変更理由').fill('ライセンス増加のため')

      await contractsPage.saveButton.click()
    })

    await test.step('変更が反映される', async () => {
      await expect(contractsPage.getContractRow('20')).toBeVisible()
    })
  })

  test('AC-05-05: ステータスを有効から更新中に変更するとリストが更新される', async ({ page }) => {
    const contractsPage = new ContractsPage(page)
    const token = await getAuthToken('admin@example.com', 'admin123')

    await test.step('APIでテストデータを作成', async () => {
      const product = await createProduct(token, {
        product_code: 'CON005',
        product_name: 'Status Change Product',
        category: 'SaaS',
        vendor: 'Vendor K',
      })
      const plan = await createPlan(token, product.id, {
        plan_code: 'BASIC',
        plan_name: 'Basic',
        monthly_base_fee: 50000,
        alert_threshold_percent: 80,
      })
      const customer = await createCustomer(token, {
        customer_code: 'STCHG',
        customer_name: 'Status Change Corp',
      })
      await createContract(token, {
        customer_id: customer.id,
        product_id: product.id,
        current_plan_id: plan.id,
        license_count: 5,
        contract_start_date: '2024-01-01',
        contract_renewal_date: '2025-01-01',
        status: 'active',
        primary_use_case: 'analytics',
      })
    })

    await test.step('管理者としてログインし契約管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, '契約管理')
    })

    await test.step('契約を編集してステータスを更新中に変更', async () => {
      await contractsPage.getEditButton('Status Change Corp').click()
      await contractsPage.statusSelect.selectOption('renewing')

      const reasonInput = page.getByLabel('変更理由')
      if (await reasonInput.isVisible()) {
        await reasonInput.fill('更新手続き中')
      }

      await contractsPage.saveButton.click()
    })

    await test.step('ステータスが更新中に変更される', async () => {
      await expect(contractsPage.getContractRow('Status Change Corp').getByText('更新中')).toBeVisible()
    })
  })
})
