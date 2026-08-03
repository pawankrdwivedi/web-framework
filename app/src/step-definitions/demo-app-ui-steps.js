import { Given, When, Then } from '../support/world.js';

Given('user navigates to the Demo App page', async ({ pageManager }) => {
  await pageManager.demoAppPage.open();
});

When('user logs in with {string} and {string}', async ({ pageManager }, username, password) => {
  await pageManager.demoAppPage.login(username, password);
});

Then('the user should see the dashboard with stats', async ({ pageManager }) => {
  await pageManager.demoAppPage.searchResultPageVisible();
});

Given('user navigates to the Demo App products page', async ({ pageManager }) => {
  await pageManager.demoAppPage.productsPageVisible();
});

Then('the user should see a list of products', async ({ pageManager }) => {
  await pageManager.demoAppPage.productsListVisible();
});

