import { basePage, logger, configManager } from 'qe-framework-core';

class ParaBank extends basePage {
    constructor(page) {
        super(page);
        const uiConfig = configManager.getUiConfig();
        //Config Date
        this.searchUrl = uiConfig.baseUrl || 'https://angular.dev';
        this.userName= uiConfig.userName || 'automation_test';
        this.password= uiConfig.password || 'automation123';    
        // Login Locators
        this.userNameLocator = 'input[name="username"]';
        this.passwordLocator = 'input[name="password"]';
        //Bill Payment Service Locators
        this.payeeName= 'input[name="payee.name"]';
        this.address= 'input[name="payee.address.street"]';
        this.city= 'input[name="payee.address.city"]';
        this.state= 'input[name="payee.address.state"]';
        this.zipCode= 'input[name="payee.address.zipCode"]';
        this.phoneNumber= 'input[name="payee.phoneNumber"]';
        this.accountNumber= 'input[name="payee.accountNumber"]';
        this.verifyAccountNumber= 'input[name="verifyAccount"]';
        this.amount= 'input[name="amount"]';
        this.fromAccount= 'select[name="fromAccountId"]';
    }

    async open() {
        await this.navigateTo(this.searchUrl);
        await this.page.waitForLoadState('networkidle');
    }

    async loginToApplication() {
        logger.info('Login to ParaBank');
        await this.fill(this.userNameLocator, this.userName);
        await this.fill(this.passwordLocator, this.password);
        await this.page.getByRole('button', { name: 'Log In' }).click();    
    }

    async clickLinkInAccountServies(linkName) {
        logger.info(`Clicking link in Account Services: "${linkName}"`);
        await this.page.getByRole('link', { name: linkName }).click();
    }

    async fillBillPaymentForm(payeeName, address, city, state, zipCode, phoneNumber, accountNumber, verifyAccountNumber, amount, fromAccount) {
        logger.info('Entering Bill Payment Service Information and creating transaction');
        await this.fill(this.payeeName, payeeName);
        await this.fill(this.address, address);
        await this.fill(this.city, city);
        await this.fill(this.state, state);
        await this.fill(this.zipCode, zipCode);
        await this.fill(this.phoneNumber, phoneNumber);
        await this.fill(this.accountNumber, accountNumber);
        await this.fill(this.verifyAccountNumber, verifyAccountNumber);
        await this.fill(this.amount, amount);
        await this.page.selectOption(this.fromAccount, { label: fromAccount });
        await this.page.getByRole('button', { name: 'Send Payment' }).click(); 
    }   
}

export default ParaBank;
export { ParaBank };
