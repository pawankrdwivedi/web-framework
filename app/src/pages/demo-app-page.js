import { basePage, logger, configManager, runtimeDataManager } from 'qe-framework-core';

class DemoAppPage extends basePage {
  constructor(page) {
    super(page);
    const uiConfig = configManager.getUiConfig();
    this.searchUrl = uiConfig.baseUrl;
    
    // Locators
    // Primary is intentionally broken to trigger self-healing
  }

  async open() {
    await this.page.goto('http://localhost:5173/login');
  await this.page.waitForLoadState('networkidle');
  }

  async login(username, password) {
    await this.page.fill('input[placeholder="Username"]', username);
    await this.page.fill('input[placeholder="Password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  async searchResultPageVisible() {
    const heading = this.page.locator('h2', { hasText: 'Dashboard' });
    await expect(heading).toBeVisible();
    const sales = this.page.locator('h3', { hasText: 'Total Sales' });
    await expect(sales).toBeVisible();
  }
}

export default DemoAppPage;
export { DemoAppPage };
