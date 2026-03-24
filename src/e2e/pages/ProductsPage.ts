import type { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly tableRows: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1', { hasText: '製品一覧' });
    this.addButton = page.locator('button', { hasText: '製品追加' });
    this.tableRows = page.locator('table tbody tr');
    this.modal = page.locator('[class*="fixed"]').filter({ hasText: '製品追加' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/products');
    await this.heading.waitFor({ state: 'visible' });
  }

  async openAddModal(): Promise<void> {
    await this.addButton.click();
    await this.page.locator('input[name="name"]').waitFor({ state: 'visible' });
  }

  async fillProductForm(opts: {
    name: string;
    category: string;
    status?: string;
  }): Promise<void> {
    await this.page.fill('input[name="name"]', opts.name);
    await this.page.fill('input[name="category"]', opts.category);
    if (opts.status) {
      await this.page.selectOption('select[name="status"]', opts.status);
    }
  }

  async submitForm(): Promise<void> {
    await this.page.locator('button[type="submit"]', { hasText: /保存/ }).click();
    // Wait for modal to close
    await this.page.locator('input[name="name"]').waitFor({ state: 'hidden' });
  }

  async getProductNames(): Promise<string[]> {
    const cells = this.tableRows.locator('td:first-child');
    return cells.allTextContents();
  }
}
