import { test } from '@playwright/test';
import { PageManager } from '../pages/page-manager.js';

test.describe('Demo App E2E Tests', () => {
  let pageManager;

  test.beforeEach(async ({ page }) => {
    pageManager = new PageManager(page);
  });

  test('User can login and view the dashboard', async () => {
    await test.step('Given user navigates to the Demo App page', async () => {
      await pageManager.demoAppPage.open();
    });

    await test.step('And user logs in with "admin" and "password"', async () => {
      await pageManager.demoAppPage.login('admin', 'password');
    });

    await test.step('Then the user should see the dashboard with stats', async () => {
      await pageManager.demoAppPage.searchResultPageVisible();
    });
  });

  test('User can view products', async () => {
    await test.step('Given user navigates to the Demo App page', async () => {
      await pageManager.demoAppPage.open();
    });

    await test.step('And user navigates to the Demo App products page', async () => {
      await pageManager.demoAppPage.productsPageVisible();
    });

    await test.step('Then the user should see a list of products', async () => {
      await pageManager.demoAppPage.productsListVisible();
    });
  });
});
