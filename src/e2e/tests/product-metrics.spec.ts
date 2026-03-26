import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsSales, navigateTo } from '../helpers/auth-helper'
import { MasterPage } from '../pages/MasterPage'
import { getAuthToken, createProduct, createMetric } from '../helpers/api-helper'
import { setupTestDb, cleanupTestData, teardownTestDb } from '../helpers/test-cleanup'

test.beforeAll(async () => { await setupTestDb() })
test.afterAll(async () => { await teardownTestDb() })
test.beforeEach(async () => { await cleanupTestData() })

test.describe('製品・メトリクス管理', () => {
  test('AC-02-01: 管理者が製品CRM001/CloudCRM Proを作成するとリストに表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await expect(master.heading).toBeVisible()
    })

    await test.step('新規登録をクリック', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
    })

    await test.step('製品情報を入力して保存', async () => {
      await master.productCodeInput.fill('CRM001')
      await master.productNameInput.fill('CloudCRM Pro')
      await master.categoryInput.fill('CRM')
      await master.vendorInput.fill('Cloud Corp')
      await master.saveButton.click()
    })

    await test.step('製品がリストに表示される', async () => {
      await expect(master.getTableRow('CRM001')).toBeVisible()
      await expect(master.getTableRow('CloudCRM Pro')).toBeVisible()
    })
  })

  test('AC-02-02: 管理者が製品名を編集するとリストが更新される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createProduct(token, {
        product_code: 'EDIT001',
        product_name: 'EditTarget',
        category: 'SaaS',
        vendor: 'Vendor A',
      })
    })

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('製品を編集', async () => {
      await master.getEditButton('EDIT001').click()
      await master.productNameInput.clear()
      await master.productNameInput.fill('EditTarget Updated')
      await master.saveButton.click()
    })

    await test.step('更新された製品名がリストに表示される', async () => {
      await expect(master.getTableRow('EditTarget Updated')).toBeVisible()
    })
  })

  test('AC-02-03: 管理者が製品を削除するとリストから消える', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createProduct(token, {
        product_code: 'DEL001',
        product_name: 'DeleteTarget',
        category: 'SaaS',
        vendor: 'Vendor B',
      })
    })

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('製品を削除', async () => {
      await master.getDeleteButton('DEL001').click()
    })

    await test.step('製品がリストから消える', async () => {
      await expect(master.getTableRow('DEL001')).not.toBeVisible()
    })
  })

  test('AC-02-04: 重複する製品コードで登録するとエラーが表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createProduct(token, {
        product_code: 'DUP001',
        product_name: 'DupProduct',
        category: 'CRM',
        vendor: 'Vendor C',
      })
    })

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('同じ製品コードで新規登録を試みる', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.productCodeInput.fill('DUP001')
      await master.productNameInput.fill('Another Product')
      await master.categoryInput.fill('CRM')
      await master.vendorInput.fill('Vendor D')
      await master.saveButton.click()
    })

    await test.step('エラーメッセージが表示される', async () => {
      await expect(page.getByText('製品コードが重複しています')).toBeVisible()
    })
  })

  test('AC-02-05: 管理者がメトリクス定義を作成するとリストに表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで製品を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createProduct(token, {
        product_code: 'MET001',
        product_name: 'MetricProduct',
        category: 'SaaS',
        vendor: 'Vendor E',
      })
    })

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('製品を選択する', async () => {
      await master.selectProductInTable('MetricProduct')
    })

    await test.step('メトリクス定義タブに切り替え', async () => {
      await master.switchToTab('メトリクス定義')
    })

    await test.step('メトリクス定義を新規登録', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.metricCodeInput.fill('api_calls')
      await master.metricNameInput.fill('API呼び出し数')
      await master.metricUnitInput.fill('回')
      await master.saveButton.click()
    })

    await test.step('メトリクスがリストに表示される', async () => {
      await expect(master.getTableRow('api_calls')).toBeVisible()
    })
  })

  test('AC-02-06: 営業ユーザーがマスタ管理ページにアクセスすると管理者タブが非表示', async ({ page }) => {
    await test.step('営業ユーザーとしてログイン', async () => {
      await loginAsSales(page)
    })

    await test.step('マスタ管理ページにアクセスする', async () => {
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('管理者タブが非表示', async () => {
      const heading = page.getByRole('heading', { name: 'マスタ管理' })
      await expect(heading).toBeVisible()
      const nav = page.getByRole('navigation', { name: 'マスタ管理タブ' })
      await expect(nav.getByRole('button', { name: 'ユーザー管理' })).not.toBeVisible()
      await expect(nav.getByRole('button', { name: '監査ログ' })).not.toBeVisible()
    })
  })
})
