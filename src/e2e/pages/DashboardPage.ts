import type { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly kpiCards: Locator;
  readonly monthlyRevenueCard: Locator;
  readonly activeContractsCard: Locator;
  readonly activeTrialsCard: Locator;
  readonly conversionRateCard: Locator;
  readonly revenueChartHeading: Locator;
  readonly productRevenueChartHeading: Locator;
  readonly customerRankingHeading: Locator;
  readonly expiringTrialsHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: 'Dashboard' });
    this.kpiCards = page.locator('[class*="grid"] [class*="rounded"]').filter({
      hasText: /月次売上合計|アクティブ契約数|進行中トライアル|トライアル転換率/,
    });
    this.monthlyRevenueCard = page.locator('div', { hasText: '月次売上合計' }).first();
    this.activeContractsCard = page.locator('div', { hasText: 'アクティブ契約数' }).first();
    this.activeTrialsCard = page.locator('div', { hasText: '進行中トライアル' }).first();
    this.conversionRateCard = page.locator('div', { hasText: 'トライアル転換率' }).first();
    this.revenueChartHeading = page.locator('h2', { hasText: '月次売上推移' });
    this.productRevenueChartHeading = page.locator('h2', { hasText: '製品別売上比率' });
    this.customerRankingHeading = page.locator('h2', { hasText: '顧客ランキング' });
    this.expiringTrialsHeading = page.locator('h2', { hasText: '期限間近トライアル' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.heading.waitFor({ state: 'visible' });
  }
}
