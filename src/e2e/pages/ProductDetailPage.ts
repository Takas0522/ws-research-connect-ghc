import type { Page, Locator } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;
  readonly productHeading: Locator;
  readonly backLink: Locator;
  readonly addPlanButton: Locator;
  readonly planTableRows: Locator;
  readonly planModal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productHeading = page.locator('h1');
    this.backLink = page.locator('a', { hasText: '← 製品一覧に戻る' });
    this.addPlanButton = page.locator('button', { hasText: 'プラン追加' });
    this.planTableRows = page.locator('table tbody tr');
    this.planModal = page.locator('[class*="fixed"]').filter({ hasText: 'プラン追加' });
  }

  async openAddPlanModal(): Promise<void> {
    await this.addPlanButton.click();
    await this.page.locator('input[name="name"]').first().waitFor({ state: 'visible' });
  }

  async fillPlanForm(opts: {
    name: string;
    monthlyFee: string;
  }): Promise<void> {
    await this.page.fill('input[name="name"]', opts.name);
    await this.page.fill('input[name="monthlyFee"]', opts.monthlyFee);
  }

  async submitPlanForm(): Promise<void> {
    await this.page.locator('button[type="submit"]', { hasText: /保存/ }).click();
    await this.page.locator('input[name="name"]').waitFor({ state: 'hidden' });
  }

  async getPlanNames(): Promise<string[]> {
    const cells = this.planTableRows.locator('td:first-child');
    return cells.allTextContents();
  }
}
