import { test as base, createBdd } from 'playwright-bdd';
import { configManager, logger, apiClient, etlValidator, dbClient, softAssert, excelReader, runtimeDataManager } from 'qe-framework-core';
import path from 'path';
import fs from 'fs';
import PageManager from '../pages/page-manager.js';

/**
 * Extended test fixtures for playwright-bdd.
 * pageManager: provides all page objects to step functions via destructuring.
 */
export const test = base.extend({
  world: async ({}, use) => {
    const world = {
      // Core Utilities binding
      config: configManager,
      logger,
      etl: etlValidator,
      db: dbClient,
      excel: excelReader,

      // Cross-scenario shared runtime data store (singleton)
      runtime: runtimeDataManager,

      // Per-scenario instance bindings
      api: new apiClient(),
      softAssert: new softAssert(),

      // Playwright Browser References (set during Before hooks)
      browser: null,
      context: null,
      page: null,

      // Placeholder for Excel/Scenario Test Data
      testData: {},

      // Scenario details
      scenarioName: '',

      /**
       * Helper to load external Excel test data based on TestCaseID.
       */
      loadExcelTestData(sheetName, testCaseId, dataTable = null) {
        // Extract and merge DataTable data from current step (if any)
        if (dataTable && typeof dataTable.hashes === 'function') {
          const hashes = dataTable.hashes();
          if (hashes && hashes.length > 0) {
            this.testData = { ...this.testData, ...hashes[0] };
          }
        }

        const hasFeatureFileData = Object.keys(this.testData).some(
          (key) => key.toLowerCase() !== 'testcaseid'
        );

        if (hasFeatureFileData) {
          logger.info('Test data is defined in the feature file. Skipping Excel data fetch.');
          logger.debug(`Scenario test-data populated: ${JSON.stringify(this.testData)}`);
          return;
        }

        if (testCaseId) {
          const basePath = fs.existsSync(path.join(process.cwd(), 'app')) ? 'app' : '';
          const testDataDir = 'src/test-data';
          const excelFileName = 'test-data.xlsx';
          const filePath = path.join(process.cwd(), basePath, testDataDir, excelFileName);
          logger.info(`Loading test data from Sheet: "${sheetName}" for TestCaseID: "${testCaseId}"`);

          try {
            const excelRow = excelReader.getRowByTestCaseId(filePath, sheetName, testCaseId);
            if (excelRow) {
              const resolvedRow = excelReader.resolveEnvData(excelRow, configManager.getEnvironment());
              this.testData = { ...this.testData, ...resolvedRow };
              logger.debug(`Scenario test-data populated from Excel: ${JSON.stringify(this.testData)}`);
              return;
            }
          } catch (err) {
            logger.warn(`Excel fetch failed for TestCaseID: "${testCaseId}" in Sheet: "${sheetName}": ${err.message}`);
          }
        }

        logger.warn(`Test data not found in Excel sheet: "${sheetName}" for TestCaseID: "${testCaseId}", and no data was defined in the feature file.`);
      }
    };

    await use(world);
  },

  // pageManager fixture: instantiated per-test and available via destructuring in step functions
  pageManager: async ({ page }, use) => {
    const pm = new PageManager(page);
    await use(pm);
  }
});

// Re-export createBdd using the extended test so all step files get the fixtures
export const { Given, When, Then, Before, After, BeforeAll, AfterAll } = createBdd(test);
export default test;

