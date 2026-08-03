import { Before, After, BeforeAll, AfterAll } from './world.js';
import fs from 'fs';
import path from 'path';
import { browserManager, logger, configManager, 
         softAssert, componentTestHelper } from 'qe-framework-core';
import PageManager from '../pages/page-manager.js';

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

Before(async function ({ $testInfo }) {
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

  // Only initialize browser context if it is a UI scenario
  if (tags.includes('@ui')) {
    const { context, page } = await browserManager.createContext(this.scenarioName);
    this.context = context;
    this.page = page;
    try {
      this.pageManager=new PageManager(page);
      logger.info(`Successfully initialized PageManager`);
    } catch (err) {
      logger.error(`Failed to initialize PageManager: ${err.message}`);
    }

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
    logger.info('Non-UI Scenario: Skipping browser initialization.');
  }
});

After(async function ({ $testInfo }) {
  const scenarioFailed = $testInfo ? $testInfo.status !== 'passed' && $testInfo.status !== 'skipped' : false;
  
  if (scenarioFailed) {
    logger.error(`Scenario FAILED: "${this.scenarioName}"`);
  } else {
    logger.info(`Scenario PASSED: "${this.scenarioName}"`);
  }

  // Close context
  if (this.context) {
    try {
      await componentTestHelper.stopMockMode();
      await browserManager.closeContext(scenarioFailed, this.scenarioName);
    } catch (err) {
      logger.error(`Failed to close browser context: ${err.message}`);
    }
  }

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
  