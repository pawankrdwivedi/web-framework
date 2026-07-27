import { When, Then } from '@cucumber/cucumber';
import ParaBankPage from '../pages/para-bank-page.js';

When('user navigates to Para Bank Home Page', async function () {
  this.paraBankPage = new ParaBankPage(this.page);
  await this.paraBankPage.open();
});

When('user login to the application', async function () {
  await this.paraBankPage.loginToApplication();
});

Then('click to Account Services Link {string}', async function (accountServiceLink) {
  await this.paraBankPage.clickLinkInAccountServies(accountServiceLink);
});

When('user fills Bill Payment Service form with data', async function (dataTable) {
  const data = dataTable.rowsHash();
  await this.paraBankPage.fillBillPaymentForm(
    data.payeeName,
    data.address,
    data.city,
    data.state,
    data.zipCode,
    data.phoneNumber,
    data.accountNumber,
    data.verifyAccountNumber,
    data.amount,
    data.fromAccount
  );
});
