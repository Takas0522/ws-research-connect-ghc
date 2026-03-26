import { test, expect } from '@playwright/test'
import { loginAsAdmin, navigateTo } from '../helpers/auth-helper'
import { ImportPage } from '../pages/ImportPage'

test.describe('データ取込', () => {
  test('AC-06-05: 取込履歴セクションが表示される', async ({ page }) => {
    const importPage = new ImportPage(page)

    await test.step('管理者としてログイン', async () => {
      await loginAsAdmin(page)
    })

    await test.step('データ取込ページに移動', async () => {
      await navigateTo(page, 'データ取込')
    })

    await test.step('取込履歴セクションが表示される', async () => {
      await expect(importPage.historyHeading).toBeVisible()
    })
  })

  test('ファイルアップロードUIが表示される', async ({ page }) => {
    const importPage = new ImportPage(page)

    await test.step('管理者としてログイン', async () => {
      await loginAsAdmin(page)
    })

    await test.step('データ取込ページに移動', async () => {
      await navigateTo(page, 'データ取込')
    })

    await test.step('ファイルアップロードエリアが表示される', async () => {
      await expect(page.getByText('CSVファイルをドラッグ＆ドロップ')).toBeVisible()
      await expect(importPage.fileInput).toBeAttached()
    })
  })
})
