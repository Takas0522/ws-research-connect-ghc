import { test, expect } from '@playwright/test'
import { loginAsAdmin, navigateTo } from '../helpers/auth-helper'
import { MasterPage } from '../pages/MasterPage'
import { getAuthToken, createCustomer } from '../helpers/api-helper'
import { setupTestDb, cleanupTestData, teardownTestDb } from '../helpers/test-cleanup'

test.beforeAll(async () => { await setupTestDb() })
test.afterAll(async () => { await teardownTestDb() })
test.beforeEach(async () => { await cleanupTestData() })

test.describe('顧客管理', () => {
  test('AC-04-01: 管理者がCUST001/ABC商事を作成するとリストに表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('顧客タブに切り替え', async () => {
      await master.switchToTab('顧客')
    })

    await test.step('顧客を新規登録', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.customerCodeInput.fill('CUST001')
      await master.customerNameInput.fill('ABC商事')
      await master.saveButton.click()
    })

    await test.step('顧客がリストに表示される', async () => {
      await expect(master.getTableRow('CUST001')).toBeVisible()
      await expect(master.getTableRow('ABC商事')).toBeVisible()
    })
  })

  test('AC-04-02: 管理者が担当営業を変更するとリストに反映される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで顧客を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createCustomer(token, {
        customer_code: 'CUST002',
        customer_name: 'XYZ株式会社',
      })
    })

    await test.step('管理者としてログインし顧客タブへ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.switchToTab('顧客')
    })

    await test.step('顧客を編集して担当営業を設定', async () => {
      await master.getEditButton('CUST002').click()
      await master.salesUserSelect.selectOption({ index: 1 })
      await master.saveButton.click()
    })

    await test.step('顧客リストが更新される', async () => {
      await expect(master.getTableRow('XYZ株式会社')).toBeVisible()
    })
  })

  test('AC-04-03: 重複する顧客コードで登録するとエラーが表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで顧客を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createCustomer(token, {
        customer_code: 'DUPCUST',
        customer_name: 'Dup Customer',
      })
    })

    await test.step('管理者としてログインし顧客タブへ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.switchToTab('顧客')
    })

    await test.step('同じ顧客コードで登録を試みる', async () => {
      await page.getByRole('button', { name: '新規登録' }).click()
      await master.customerCodeInput.fill('DUPCUST')
      await master.customerNameInput.fill('Another Customer')
      await master.saveButton.click()
    })

    await test.step('エラーが表示される', async () => {
      await expect(page.getByText('顧客コードが重複しています')).toBeVisible()
    })
  })

  test('AC-04-04: 管理者が顧客を無効化するとリストから消える', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIで顧客を作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createCustomer(token, {
        customer_code: 'DELCUST',
        customer_name: 'DeleteCustomer',
      })
    })

    await test.step('管理者としてログインし顧客タブへ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.switchToTab('顧客')
    })

    await test.step('顧客を削除', async () => {
      page.on('dialog', (dialog) => void dialog.accept())
      await master.getDeleteButton('DELCUST').click()
    })

    await test.step('顧客がリストから消える', async () => {
      await expect(master.getTableRow('DELCUST')).not.toBeVisible()
    })
  })
})
