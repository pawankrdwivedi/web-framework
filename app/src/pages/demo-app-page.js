import { basePage, configManager, playwrightAssertions } from 'qe-framework-core';

class DemoAppPage extends basePage {
  constructor(page) {
    super(page);
    const uiConfig = configManager.getUiConfig();
    this.playwrightAssertions = new playwrightAssertions(() => this.page, this);
    this.searchUrl = uiConfig.baseUrl;
    
    // Locators
    this.loginLink='a.btn';
    this.usernameInput='placeholder=Username';
    this.passwordInput='placeholder=Password';
    this.loginButton='role=button:Login';
    this.dashboardHeading='h2:has-text("Dashboard")';
    this.totalSalesHeading='h3:has-text("Total Sales")';
    this.productsHeading='h2:has-text("Products")';
    this.addToCartButtons='button:has-text("Add to Cart")';
  }

  async open() {
    await this.navigateTo(this.searchUrl);
    await this.waitForNetworkIdle();
  }

  async login(username, password) {
    await this.click(this.loginLink);
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
    await this.waitForNetworkIdle();
  }

  async searchResultPageVisible() {
    await this.playwrightAssertions.assertElementVisible(this.dashboardHeading, 'Dashboard heading is visible');
    await this.playwrightAssertions.assertElementVisible(this.totalSalesHeading, 'Total Sales heading is visible');
  }

  async productsPageVisible() {
    await this.page.getByRole('link', { name: 'Products' }).click();
    await this.waitForNetworkIdle();
  }

  async productsListVisible() {
    await this.playwrightAssertions.assertElementVisible(this.productsHeading, 'Products heading is visible');
    //await this.playwrightAssertions.assertElementVisible(this.addToCartButtons, 'Add to Cart buttons are visible');
  }
}

export default DemoAppPage;
export { DemoAppPage };
