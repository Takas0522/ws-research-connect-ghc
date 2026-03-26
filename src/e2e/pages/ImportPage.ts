import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class ImportPage extends BasePage {
  readonly heading: Locator
  readonly fileInput: Locator
  readonly uploadButton: Locator
  readonly selectFileButton: Locator
  readonly previewHeading: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator
  readonly retryButton: Locator
  readonly historyHeading: Locator
  readonly replacementWarning: Locator
  readonly uploadNewFileButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'データ取込' })
    this.fileInput = page.getByLabel('CSVファイル選択')
    this.uploadButton = page.getByRole('button', { name: 'アップロード' })
    this.selectFileButton = page.getByRole('button', { name: 'ファイルを選択' })
    this.previewHeading = page.getByRole('heading', { name: '取込プレビュー' })
    this.confirmButton = page.getByRole('button', { name: '確定' })
    this.cancelButton = page.getByRole('button', { name: 'キャンセル' })
    this.successMessage = page.getByText('データの取込が完了しました')
    this.errorMessage = page.locator('.bg-red-50')
    this.retryButton = page.getByText('やり直す')
    this.historyHeading = page.getByRole('heading', { name: '取込履歴' })
    this.replacementWarning = page.getByText('同一対象月のデータが既に存在します')
    this.uploadNewFileButton = page.getByText('新しいファイルをアップロード')
  }

  get path(): string {
    return '/import'
  }

  getHistoryRow(text: string): Locator {
    return this.page.locator('tr', { hasText: text })
  }

  getPreviewRows(): Locator {
    return this.page.locator('table').last().locator('tbody tr')
  }
}
