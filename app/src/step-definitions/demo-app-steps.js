import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

When('user navigates to the Demo App login page', async function () {
  await this.page.goto('http://localhost:5173/login');
  await this.page.waitForLoadState('networkidle');
});

When('user logs in with {string} and {string}', async function (username, password) {
  await this.page.fill('input[placeholder="Username"]', username);
  await this.page.fill('input[placeholder="Password"]', password);
  await this.page.click('button[type="submit"]');
  await this.page.waitForLoadState('networkidle');
});

Then('the user should see the dashboard with stats', async function () {
  const heading = this.page.locator('h2', { hasText: 'Dashboard' });
  await expect(heading).toBeVisible();
  
  const sales = this.page.locator('h3', { hasText: 'Total Sales' });
  await expect(sales).toBeVisible();
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
