import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import DemoAppPage from '../pages/demo-app-page.js';

When('user navigates to the Demo App login page', async function () {
  this.demoAppPage = new DemoAppPage(this.page);
  await this.demoAppPage.open();
});

When('user logs in with {string} and {string}', async function (username, password) {
  await this.demoAppPage.login(username, password);
});

Then('the user should see the dashboard with stats', async function () {
  await this.demoAppPage.searchResultPageVisible();
});

When('user navigates to the Demo App products page', async function () {
  await this.page.goto('http://localhost:5173/products');
  await this.page.waitForLoadState('networkidle');
});

Then('the user should see a list of products', async function () {
  const heading = this.page.locator('h2', { hasText: 'Products' });
  await expect(heading).toBeVisible();
  
  const addButtons = this.page.locator('button', { hasText: 'Add to Cart' });
  expect(await addButtons.count()).toBeGreaterThan(0);
});
