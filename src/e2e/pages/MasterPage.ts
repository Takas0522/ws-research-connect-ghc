import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class MasterPage extends BasePage {
  readonly heading: Locator
  readonly tabNav: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'マスタ管理' })
    this.tabNav = page.getByRole('navigation', { name: 'マスタ管理タブ' })
  }

  get path(): string {
    return '/master'
  }

  getTab(name: string): Locator {
    return this.tabNav.getByRole('button', { name })
  }

  async switchToTab(name: string): Promise<void> {
    await this.getTab(name).click()
  }

  async selectProductInTable(productName: string): Promise<void> {
    await this.page.locator('tr', { hasText: productName }).click()
  }

  // -- Product helpers --
  get productCreateButton(): Locator {
    return this.page.getByRole('button', { name: '新規登録' })
  }

  get productCodeInput(): Locator {
    return this.page.getByLabel('製品コード')
  }

  get productNameInput(): Locator {
    return this.page.getByLabel('製品名')
  }

  get categoryInput(): Locator {
    return this.page.getByLabel('カテゴリ')
  }

  get vendorInput(): Locator {
    return this.page.getByLabel('ベンダー')
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: '保存' })
  }

  get cancelButton(): Locator {
    return this.page.getByRole('button', { name: 'キャンセル' })
  }

  get registerButton(): Locator {
    return this.page.getByRole('button', { name: '登録', exact: true })
  }

  getEditButton(rowText: string): Locator {
    return this.page.locator('tr', { hasText: rowText }).getByRole('button', { name: '編集' })
  }

  getDeleteButton(rowText: string): Locator {
    return this.page.locator('tr', { hasText: rowText }).getByRole('button', { name: '削除' })
  }

  getTableRow(text: string): Locator {
    return this.page.locator('tr', { hasText: text })
  }

  // -- Metrics helpers --
  get metricCodeInput(): Locator {
    return this.page.getByLabel('メトリクスコード')
  }

  get metricNameInput(): Locator {
    return this.page.getByLabel('メトリクス名')
  }

  get metricUnitInput(): Locator {
    return this.page.getByLabel('単位')
  }

  // -- Plan helpers --
  get planCodeInput(): Locator {
    return this.page.getByLabel('プランコード')
  }

  get planNameInput(): Locator {
    return this.page.getByLabel('プラン名')
  }

  get monthlyBaseFeeInput(): Locator {
    return this.page.getByLabel('月額基本料（円）')
  }

  get alertThresholdInput(): Locator {
    return this.page.getByLabel('アラート閾値（%）')
  }

  // -- Customer helpers --
  get customerCodeInput(): Locator {
    return this.page.getByLabel('顧客コード')
  }

  get customerNameInput(): Locator {
    return this.page.getByLabel('顧客名')
  }

  get salesUserSelect(): Locator {
    return this.page.getByLabel('担当営業')
  }

  // -- User Tab helpers --
  get userEmailInput(): Locator {
    return this.page.getByLabel('メールアドレス')
  }

  get userDisplayNameInput(): Locator {
    return this.page.getByLabel('表示名')
  }

  get userRoleSelect(): Locator {
    return this.page.getByLabel('ロール')
  }

  get userPasswordInput(): Locator {
    return this.page.getByLabel('パスワード')
  }

  getDeactivateButton(rowText: string): Locator {
    return this.page.locator('tr', { hasText: rowText }).getByRole('button', { name: '無効化' })
  }

  get confirmButton(): Locator {
    return this.page.getByRole('button', { name: '確認' })
  }
}
