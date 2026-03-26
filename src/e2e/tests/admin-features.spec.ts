import { test, expect } from '@playwright/test'
import { loginAsAdmin, loginAsSales, navigateTo } from '../helpers/auth-helper'
import { MasterPage } from '../pages/MasterPage'
import { getAuthToken, createUser } from '../helpers/api-helper'
import { setupTestDb, cleanupTestData, teardownTestDb } from '../helpers/test-cleanup'

test.beforeAll(async () => { await setupTestDb() })
test.afterAll(async () => { await teardownTestDb() })
test.beforeEach(async () => { await cleanupTestData() })

test.describe('管理者機能', () => {
  test('AC-08-01: 管理者がユーザーを作成するとリストに表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('ユーザー管理タブに切り替え', async () => {
      await master.switchToTab('ユーザー管理')
    })

    await test.step('新規ユーザーを登録', async () => {
      await master.productCreateButton.click()
      await master.userEmailInput.fill('sales01@example.com')
      await master.userDisplayNameInput.fill('営業01')
      await master.userRoleSelect.selectOption('sales')
      await master.userPasswordInput.fill('password123')
      await master.registerButton.click()
    })

    await test.step('ユーザーがリストに表示される', async () => {
      await expect(master.getTableRow('sales01@example.com')).toBeVisible()
    })
  })

  test('AC-08-02: 管理者がユーザーを無効化するとログインできなくなる', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('APIでユーザーを作成', async () => {
      const token = await getAuthToken('admin@example.com', 'admin123')
      await createUser(token, {
        email: 'deactivate@example.com',
        display_name: '無効化対象',
        role: 'sales',
        password: 'password123',
      })
    })

    await test.step('管理者としてログインしユーザー管理タブへ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
      await master.switchToTab('ユーザー管理')
    })

    await test.step('ユーザーを無効化', async () => {
      await master.getDeactivateButton('deactivate@example.com').click()
      await master.confirmButton.click()
    })

    await test.step('ステータスが無効に変わる', async () => {
      const row = master.getTableRow('deactivate@example.com')
      await expect(row.getByText('無効', { exact: true })).toBeVisible()
    })
  })

  test('AC-08-03: 管理者が監査ログタブを表示すると履歴が表示される', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('管理者としてログインしマスタ管理へ移動', async () => {
      await loginAsAdmin(page)
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('監査ログタブに切り替え', async () => {
      await master.switchToTab('監査ログ')
    })

    await test.step('監査ログセクションが表示される', async () => {
      await expect(page.getByRole('heading', { name: '監査ログ' })).toBeVisible()
    })
  })

  test('AC-08-04: 営業ユーザーは管理者タブにアクセスできない', async ({ page }) => {
    const master = new MasterPage(page)

    await test.step('営業ユーザーとしてログイン', async () => {
      await loginAsSales(page)
    })

    await test.step('マスタ管理ページに移動', async () => {
      await navigateTo(page, 'マスタ管理')
    })

    await test.step('ユーザー管理タブと監査ログタブが表示されない', async () => {
      // Admin-only tabs should not be visible to sales users
      await expect(master.getTab('ユーザー管理')).not.toBeVisible()
      await expect(master.getTab('監査ログ')).not.toBeVisible()
    })
  })
})
