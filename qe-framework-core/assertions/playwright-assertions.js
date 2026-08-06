import logger from '../logger/logger.js';

class PlaywrightAssertions {
  constructor(pageOrProvider = null, world = null) {
    this.pageOrProvider = pageOrProvider;
    this.world = world;
    this.defaultTimeout = 10000;
  }

  setPage(pageOrProvider) {
    this.pageOrProvider = pageOrProvider;
  }

  setWorld(world) {
    this.world = world;
  }

  resolvePage() {
    const page = typeof this.pageOrProvider === 'function' ? this.pageOrProvider() : this.pageOrProvider;
    if (!page) {
      throw new Error('Playwright page is not available for assertion execution.');
    }
    return page;
  }

  resolveLocator(selectorOrLocator) {
    if (typeof selectorOrLocator === 'string') {
      return this.resolvePage().locator(selectorOrLocator);
    }
    return selectorOrLocator;
  }

  throwAssertionError(message, details = '') {
    const errorMessage = details ? `${message}\n${details}` : message;
    logger.error(`Playwright Assertion FAILED: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  passAssertion(message, details = '') {
    const finalMessage = details ? `${message} | ${details}` : message;
    logger.info(`Playwright Assertion PASSED: ${finalMessage}`);
  }

  async assertElementVisible(selectorOrLocator, message = 'Verified element is visible', timeout = this.defaultTimeout) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'visible', timeout });
      this.passAssertion(message);
    } catch (error) {
      this.throwAssertionError(message, `Element was not visible within ${timeout}ms. ${error.message}`);
    }
  }

  async assertElementDisplayed(selectorOrLocator, message = 'Verified element is displayed', timeout = this.defaultTimeout) {
    await this.assertElementVisible(selectorOrLocator, message, timeout);
  }

  async assertElementContainsText(
    selectorOrLocator,
    expectedText,
    message = `Verified element contains text "${expectedText}"`,
    timeout = this.defaultTimeout
  ) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'attached', timeout });
      const actualText = (await locator.textContent()) || '';
      if (!actualText.includes(expectedText)) {
        this.throwAssertionError(message, `Expected substring: "${expectedText}", Actual text: "${actualText}"`);
      }
      this.passAssertion(message, `Actual text: "${actualText}"`);
    } catch (error) {
      if (error.message.includes('Expected substring:')) {
        throw error;
      }
      this.throwAssertionError(message, error.message);
    }
  }

  async assertElementTextEquals(
    selectorOrLocator,
    expectedText,
    message = `Verified element text exactly matches "${expectedText}"`,
    timeout = this.defaultTimeout
  ) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'attached', timeout });
      const actualText = ((await locator.textContent()) || '').trim();
      const normalizedExpected = String(expectedText).trim();
      if (actualText !== normalizedExpected) {
        this.throwAssertionError(message, `Expected: "${normalizedExpected}", Actual: "${actualText}"`);
      }
      this.passAssertion(message);
    } catch (error) {
      if (error.message.includes('Expected:')) {
        throw error;
      }
      this.throwAssertionError(message, error.message);
    }
  }

  assertTextsMatch(actualText, expectedText, message = 'Verified two text values match exactly') {
    const normalizedActual = String(actualText).trim();
    const normalizedExpected = String(expectedText).trim();
    if (normalizedActual !== normalizedExpected) {
      this.throwAssertionError(message, `Expected: "${normalizedExpected}", Actual: "${normalizedActual}"`);
    }
    this.passAssertion(message);
  }

  async assertElementHidden(selectorOrLocator, message = 'Verified element is hidden', timeout = this.defaultTimeout) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'hidden', timeout });
      this.passAssertion(message);
    } catch (error) {
      this.throwAssertionError(message, `Element was not hidden within ${timeout}ms. ${error.message}`);
    }
  }

  async assertElementEnabled(selectorOrLocator, message = 'Verified element is enabled', timeout = this.defaultTimeout) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'attached', timeout });
      const enabled = await locator.isEnabled();
      if (!enabled) {
        this.throwAssertionError(message, 'Element is disabled.');
      }
      this.passAssertion(message);
    } catch (error) {
      if (error.message.includes('Element is disabled.')) {
        throw error;
      }
      this.throwAssertionError(message, error.message);
    }
  }

  async assertElementDisabled(selectorOrLocator, message = 'Verified element is disabled', timeout = this.defaultTimeout) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'attached', timeout });
      const disabled = await locator.isDisabled();
      if (!disabled) {
        this.throwAssertionError(message, 'Element is enabled.');
      }
      this.passAssertion(message);
    } catch (error) {
      if (error.message.includes('Element is enabled.')) {
        throw error;
      }
      this.throwAssertionError(message, error.message);
    }
  }

  async assertElementChecked(selectorOrLocator, message = 'Verified element is checked', timeout = this.defaultTimeout) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.waitFor({ state: 'attached', timeout });
      const checked = await locator.isChecked();
      if (!checked) {
        this.throwAssertionError(message, 'Element is not checked.');
      }
      this.passAssertion(message);
    } catch (error) {
      if (error.message.includes('Element is not checked.')) {
        throw error;
      }
      this.throwAssertionError(message, error.message);
    }
  }

  async assertElementCount(
    selectorOrLocator,
    expectedCount,
    message = `Verified element count equals ${expectedCount}`,
    timeout = this.defaultTimeout
  ) {
    try {
      const locator = this.resolveLocator(selectorOrLocator);
      await locator.first().waitFor({ state: 'attached', timeout }).catch(() => undefined);
      const count = await locator.count();
      if (count !== expectedCount) {
        this.throwAssertionError(message, `Expected count: ${expectedCount}, Actual count: ${count}`);
      }
      this.passAssertion(message);
    } catch (error) {
      if (error.message.includes('Expected count:')) {
        throw error;
      }
      this.throwAssertionError(message, error.message);
    }
  }

  async assertUrlContains(expectedText, message = `Verified URL contains "${expectedText}"`) {
    const page = this.resolvePage();
    const currentUrl = page.url();
    if (!currentUrl.includes(expectedText)) {
      this.throwAssertionError(message, `Expected URL to contain: "${expectedText}", Actual URL: "${currentUrl}"`);
    }
    this.passAssertion(message, `Actual URL: "${currentUrl}"`);
  }

  async assertPageTitleEquals(expectedTitle, message = `Verified page title equals "${expectedTitle}"`) {
    const page = this.resolvePage();
    const actualTitle = await page.title();
    if (actualTitle !== expectedTitle) {
      this.throwAssertionError(message, `Expected title: "${expectedTitle}", Actual title: "${actualTitle}"`);
    }
    this.passAssertion(message);
  }

  async assertPageTitleContains(expectedTitle, message = `Verified page title contains "${expectedTitle}"`) {
    const page = this.resolvePage();
    const actualTitle = await page.title();
    if (!actualTitle.toLowerCase().includes(expectedTitle.toLowerCase())) {
      this.throwAssertionError(message, `Expected title: "${expectedTitle}", Actual title: "${actualTitle}"`);
    }
    this.passAssertion(message);
  }
}

export default PlaywrightAssertions;
export { PlaywrightAssertions };
