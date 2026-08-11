import { basePage, configManager, runtimeDataManager } from 'qe-framework-core';

class GoogleSearchPage extends basePage {
  constructor(page) {
    super(page);
    const uiConfig = configManager.getUiConfig();
    this.searchUrl = uiConfig.baseUrl || 'https://www.google.com/search?q=';
    
    // Locators
    this.searchQuery='#APjFqb';
  }

  async open() {
    await this.navigateTo(this.searchUrl);
    await this.waitForNetworkIdle();
    await this.waitFor(30000);
  }

  async searchQuery(query) {
    await this.fill(this.searchQuery, query);
    // Press Enter to submit search (more reliable than clicking the button)
    await this.pressKey(this.searchQuery, 'Enter');
    await this.waitForNetworkIdle();
  }

  async searchResultPageVisible(query) {
    await this.waitFor(30000);
    runtimeDataManager.set('searchQuery', query);
    //PlaywrightAssertions.assertPageTitleContains(query);
  }
}

export default GoogleSearchPage;
export { GoogleSearchPage };
