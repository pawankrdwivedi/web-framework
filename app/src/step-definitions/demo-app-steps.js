import { When, Then, Given } from '@cucumber/cucumber';

Given ('user navigates to the Demo App page', async function () {
  await this.pageManager.demoAppPage.open();
});

When('user logs in with {string} and {string}', async function (username, password) {
  await this.pageManager.demoAppPage.login(username, password);
});

Then('the user should see the dashboard with stats', async function () {
  await this.pageManager.demoAppPage.searchResultPageVisible();
});

Given ('user navigates to the Demo App products page', async function () {
  await this.pageManager.demoAppPage.productsPageVisible();
});

Then('the user should see a list of products', async function () {
await this.pageManager.demoAppPage.productsListVisible();
});
