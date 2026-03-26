import { type Page, type Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export class DashboardPage extends BasePage {
  readonly heading: Locator
  readonly loadingSpinner: Locator
  readonly errorMessage: Locator
  readonly retryButton: Locator
  readonly usageSummaryHeading: Locator
  readonly emptyState: Locator
  readonly alertSection: Locator
  readonly trendChartSection: Locator
  readonly useCaseSummary: Locator
  readonly lastUpdated: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole('heading', { name: 'ダッシュボード' })
    this.loadingSpinner = page.getByText('読み込み中...')
    this.errorMessage = page.locator('.bg-red-50')
    this.retryButton = page.getByRole('button', { name: '再試行' })
    this.usageSummaryHeading = page.getByRole('heading', { name: '利用量サマリー' })
    this.emptyState = page.getByText('データがありません')
    this.alertSection = page.getByText('アラート')
    this.trendChartSection = page.getByText('利用量トレンド')
    this.useCaseSummary = page.getByText('利用目的別')
    this.lastUpdated = page.getByText('最終更新')
  }

  get path(): string {
    return '/'
  }

  getAlertBadges(): Locator {
    return this.page.locator('.bg-red-100:has-text("アラート")')
  }

  getSummaryCards(): Locator {
    return this.page.locator('[class*="cursor-pointer"]')
  }
}
