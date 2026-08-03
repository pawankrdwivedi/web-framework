import { When, Then } from '../support/world.js';

When('user navigates to Para Bank Home Page', async ({ pageManager }) => {
  await pageManager.paraBankPage.open();
});

When('user login to the application', async ({ pageManager }) => {
  await pageManager.paraBankPage.loginToApplication();
});

Then('click to Account Services Link {string}', async ({ pageManager }, accountServiceLink) => {
  await pageManager.paraBankPage.clickLinkInAccountServies(accountServiceLink);
});

When('user fills Bill Payment Service form with data', async ({ pageManager }, dataTable) => {
  const data = dataTable.rowsHash();
  await pageManager.paraBankPage.fillBillPaymentForm(
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

