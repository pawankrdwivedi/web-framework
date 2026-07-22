import { When, Then, Before } from '@cucumber/cucumber';
import { componentTestHelper, logger } from 'qe-framework-core';

/**
 * Simplified step definitions for component testing using network Record & Playback.
 * Allows recording and playing back HTTP network interactions automatically.
 */

Before(async function (scenario) {
  // Store helper on world context so step definitions can access it
  this.componentTestHelper = componentTestHelper;
});

// ============= NETWORK RECORD & PLAYBACK STEPS =============

When('user initializes network record mode for scenario {string}', async function (scenarioName) {
  process.env.MOCK_MOUNTEBANK = 'true';
  process.env.MOCK_MOUNTEBANK_RECORD = 'true';
  process.env.MOCK_MOUNTEBANK_PLAYBACK = 'false';
  await this.componentTestHelper.initializeMockMode(this.page, scenarioName);
});

When('user initializes network playback mode for scenario {string}', async function (scenarioName) {
  process.env.MOCK_MOUNTEBANK = 'true';
  process.env.MOCK_MOUNTEBANK_RECORD = 'false';
  process.env.MOCK_MOUNTEBANK_PLAYBACK = 'true';
  await this.componentTestHelper.initializeMockMode(this.page, scenarioName);
  logger.info(`Mountebank playback initialized for scenario: ${scenarioName}`);
});

When('user initializes mountebank playback mode for scenario {string}', async function (scenarioName) {
  process.env.MOCK_MOUNTEBANK = 'true';
  process.env.MOCK_MOUNTEBANK_RECORD = 'false';
  process.env.MOCK_MOUNTEBANK_PLAYBACK = 'true';
  await this.componentTestHelper.initializeMockMode(this.page, scenarioName);
  logger.info(`Mountebank playback initialized for scenario: ${scenarioName}`);
});

When('user initializes mountebank record mode for scenario {string} and target {string}', async function (scenarioName, targetUrl) {
  process.env.MOCK_MOUNTEBANK = 'true';
  process.env.MOCK_MOUNTEBANK_RECORD = 'true';
  process.env.MOCK_MOUNTEBANK_PLAYBACK = 'false';
  process.env.MOCK_MOUNTEBANK_TARGET_URL = targetUrl;
  await this.componentTestHelper.initializeMockMode(this.page, scenarioName);
  logger.info(`Mountebank record initialized for scenario: ${scenarioName}`);
});

When('user stops network intercept mode', async function () {
  await this.componentTestHelper.stopMockMode();
});

Then('component {string} should be visible', async function (selector) {
  const isVisible = await this.page.locator(selector).isVisible();
  if (!isVisible) {
    throw new Error(`Component not visible: ${selector}`);
  }
});

Then('component {string} should have text {string}', async function (selector, expectedText) {
  const element = this.page.locator(selector);
  const actualText = await element.textContent();
  if (!actualText.includes(expectedText)) {
    throw new Error(`Expected text not found. Expected: "${expectedText}", Actual: "${actualText}"`);
  }
});
