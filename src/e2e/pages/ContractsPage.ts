import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ContractsPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly statusFilter: Locator
  readonly createButton: Locator
  readonly emptyState: Locator

  // Form fields
  readonly customerSelect: Locator
  readonly productSelect: Locator
  readonly planSelect: Locator
  readonly startDateInput: Locator
  readonly endDateInput: Locator
  readonly renewalDateInput: Locator
  readonly licenseCountInput: Locator
  readonly statusSelect: Locator
  readonly useCaseSelect: Locator
  readonly changeReasonInput: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: '契約管理' })
    this.searchInput = page.getByPlaceholder('顧客名・製品名で検索...')
    this.statusFilter = page.getByRole('combobox').first()
    this.createButton = page.getByRole('button', { name: '新規契約' })
    this.emptyState = page.getByText('契約が見つかりません')

    this.customerSelect = page.getByLabel('顧客')
    this.productSelect = page.getByLabel('製品')
    this.planSelect = page.getByLabel('プラン')
    this.startDateInput = page.getByLabel('契約開始日')
    this.endDateInput = page.getByLabel('契約終了日')
    this.renewalDateInput = page.getByLabel('契約更新日')
    this.licenseCountInput = page.getByLabel('ライセンス数')
    this.statusSelect = page.getByLabel('ステータス')
    this.useCaseSelect = page.getByLabel('主な利用目的')
    this.changeReasonInput = page.getByLabel('変更理由')
    this.saveButton = page.getByRole('button', { name: '保存' })
    this.cancelButton = page.getByRole('button', { name: 'キャンセル' })
  }

  get path(): string {
    return '/contracts'
  }

  getContractRow(text: string): Locator {
    return this.page.locator('tr', { hasText: text })
  }

  getEditButton(rowText: string): Locator {
    return this.page.locator('tr', { hasText: rowText }).getByRole('button', { name: '編集' })
  }
}
