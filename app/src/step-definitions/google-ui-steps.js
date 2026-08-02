import { When, Then } from '@cucumber/cucumber';

When('user navigates to Google Search page', async function () {
  
  await this.pageManager.googleSearchPage.open();
});

When('user searches for query {string}', async function (query) {
  await this.pageManager.googleSearchPage.searchQuery(query);
});

Then('search result page should be displayed with results for {string}', async function (query) {
  await this.pageManager.googleSearchPage.searchResultPageVisible(query);
});
