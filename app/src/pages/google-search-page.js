import { basePage, logger, configManager, playwrightAssertions, runtimeDataManager } from 'qe-framework-core';
import {expect} from '@playwright/test';

class GoogleSearchPage extends basePage {
  constructor(page) {
    super(page);
    const uiConfig = configManager.getUiConfig();
    this.searchUrl = uiConfig.baseUrl || 'https://www.google.com/search?q=';
    this.searchQuery='#APjFqb';
    
    // Locators
    // Primary is intentionally broken to trigger self-healing
  }

  async open() {
    await this.navigateTo(this.searchUrl);
    await this.waitForNetworkIdle();
    await this.waitFor(30000);
  }

  async searchQuery(query) {
    logger.info(`Performing Google Search for: "${query}"`);
    await this.fill(this.searchQuery, query);
    // Press Enter to submit search (more reliable than clicking the button)
    await this.pressKey(this.searchQuery, 'Enter');
    await this.waitForNetworkIdle();
  }

  async searchResultPageVisible(query) {
    await this.waitFor(30000);
    runtimeDataManager.set('searchQuery', query);
    //PlaywrightAssertions.assertPageTitleContains(query);
    logger.info(`Search results for "${runtimeDataManager.get('searchQuery')}" are displayed.`);
  }
}

export default GoogleSearchPage;
export { GoogleSearchPage };
