import { When, Then } from '../support/world.js';

When('user navigates to Google Search page', async ({ pageManager }) => {
    await pageManager.googleSearchPage.open();
});

When('user searches for {string}', async ({ pageManager }, query) => {
  await pageManager.googleSearchPage.searchQuery(query);
});

Then('search result page should be displayed with results for {string}', async ({ pageManager }, query) => {
  await pageManager.googleSearchPage.searchResultPageVisible(query);
});
