import { When, Then } from '@cucumber/cucumber';

When('user navigates to Para Bank Home Page', async function () {
  await this.pageManager.paraBankPage.open();
});

When('user login to the application', async function () {
  await this.pageManager.paraBankPage.loginToApplication();
});

Then('click to Account Services Link {string}', async function (accountServiceLink) {
  await this.pageManager.paraBankPage.clickLinkInAccountServies(accountServiceLink);
});

When('user fills Bill Payment Service form with data', async function (dataTable) {
  const data = dataTable.rowsHash();
  await this.pageManager.paraBankPage.fillBillPaymentForm(
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
