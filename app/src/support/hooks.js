import { Before, After, BeforeAll, AfterAll } from './world.js';
import fs from 'fs';
import path from 'path';
import { browserManager, logger, configManager, 
         softAssert, componentTestHelper, networkRecordPlaybackManager } from 'qe-framework-core';

const appRoot = path.basename(process.cwd()) === 'app' ? process.cwd() : path.join(process.cwd(), 'app');
logger.info(`appRoot: ${appRoot}`);
const MOCK_ENV_KEYS = [
  'MOCK_RECORD',
  'MOCK_PLAYBACK'
];

function captureMockEnv() {
  const snapshot = {};  
  for (const key of MOCK_ENV_KEYS) {
    snapshot[key] = process.env[key];
  }
  return snapshot;
}

function restoreMockEnv(snapshot) {
  for (const key of MOCK_ENV_KEYS) {
    if (snapshot[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snapshot[key];
    }
  }
}

const timeoutMs = configManager.getExecutionConfig().timeout;
logger.info(`timeoutMs: ${JSON.stringify(configManager.getExecutionConfig())}`);

BeforeAll(async function () {
  logger.info('Starting Global Test Execution Setup');
  
  try {
    //await dbClient.connect();
  } catch (err) {
    logger.warn('Global Database connection could not be established. Falling back to Mock.');
  }
});

Before(async function ({ $testInfo, page }) {
  this.scenarioName = $testInfo ? $testInfo.title : 'Unknown Scenario';
  this.scenarioStartTime = Date.now();
  
  // Instantiate soft asserts for this scenario
  this.softAssert = new softAssert();
  
  this.consoleLogs = [];
  this.networkLogs = [];
  
  logger.info(`------------------------------------------------------------`);
  logger.info(`Starting Scenario: "${this.scenarioName}"`);
  logger.info(`------------------------------------------------------------`);

  const tags = $testInfo && $testInfo.tags ? $testInfo.tags : [];
  this.originalMockEnv = captureMockEnv();

  // Initialize network recording/playback manager for all scenarios
  // This must happen before any network requests are made
  if (page) {
    await networkRecordPlaybackManager.init(page, this.scenarioName);
  }

  // Only initialize browser logging if it is a UI scenario
  // Browser context and page are already created by pageManager fixture in world.js
  if (tags.includes('@ui') && page) {
    // Store reference to page for use in hooks (pageManager fixture will use it independently)
    this.page = page;

    page.on('console', msg => {
      this.consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        args: msg.args()
      });
    });

    page.on('response', response => {
      this.networkLogs.push({
        method: response.request().method(),
        url: response.url(),
        status: response.status()
      });
    });
  } else {
    logger.info('Non-UI Scenario: Skipping browser logging setup.');
  }
});

After(async function ({ $testInfo }) {
  const scenarioFailed = $testInfo ? $testInfo.status !== 'passed' && $testInfo.status !== 'skipped' : false;
  
  if (scenarioFailed) {
    logger.error(`Scenario FAILED: "${this.scenarioName}"`);
  } else {
    logger.info(`Scenario PASSED: "${this.scenarioName}"`);
  }

  // Save any recorded API mocks if recording mode was active
  try {
    await networkRecordPlaybackManager.saveRecordedMocks();
    await networkRecordPlaybackManager.stop();
  } catch (err) {
    logger.warn(`Failed to clean up network mock recording: ${err.message}`);
  }

  // Browser context closure is handled automatically by Playwright-BDD fixtures
  // No need to manually close context here
  if (this.originalMockEnv) {
    restoreMockEnv(this.originalMockEnv);
  }

  // Evaluate and clear soft assertions
  try {
    this.softAssert.assertAll();
  } catch (assertErr) {
    logger.error(`Scenario failed due to soft assertions: ${assertErr.message}`);
    if (!scenarioFailed) {
      throw assertErr;
    }
  }
});

AfterAll(async function () {
  logger.info('Tearing down Global Test Execution');
  await browserManager.closeBrowser();
  //await dbClient.disconnect();
});
  