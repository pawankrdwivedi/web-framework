import { Given, When, Then } from '@cucumber/cucumber';
import GoogleSearchPage from '../pages/google-search-page.js';

When('user navigates to Google Search page', async function () {
  this.googleSearchPage = new GoogleSearchPage(this.page);
  await this.googleSearchPage.open();
});

When('user searches for query {string}', async function (query) {
  await this.googleSearchPage.searchQuery(query);
});

Then('search result page should be displayed with results for {string}', async function (query) {
  await this.googleSearchPage.searchResultPageVisible(query);
});
