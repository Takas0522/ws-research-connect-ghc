import type { Page, Locator } from '@playwright/test';

export class ContractsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: '契約一覧' });
    this.addButton = page.locator('button', { hasText: '新規契約' });
    this.tableRows = page.locator('table tbody tr');
  }

  async goto(): Promise<void> {
    await this.page.goto('/contracts');
    await this.heading.waitFor({ state: 'visible' });
  }

  async getCustomerNamesInTable(): Promise<string[]> {
    const cells = this.tableRows.locator('td:first-child');
    return cells.allTextContents();
  }
}
