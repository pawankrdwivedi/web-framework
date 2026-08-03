import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { configManager } from 'qe-framework-core';
import path from 'path';
import fs from 'fs';

const currentDir = process.cwd();
const isRoot = fs.existsSync(path.join(currentDir, 'app', 'package.json'));

const appName = process.env.APP || '';

if (!isRoot && path.basename(currentDir) !== 'app' && path.basename(currentDir) !== appName) {
  throw new Error('Playwright execution is only allowed from inside the "app" folder or project root.');
}

const baseAppPath = isRoot ? 'app' : '.';


// Load environment variables first
try {
  const searchPaths = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'app', '.env')
  ];
  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }
} catch (e) {
  // Ignore
}

// Load execution and UI config using the framework's ConfigManager
const execConfig = configManager.getExecutionConfig();
const uiConfig = configManager.getUiConfig();

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseMode = (value, allowed, fallback) => {
  if (!value) return fallback;
  return allowed.includes(value) ? value : fallback;
};

// Map browser config to devices
const browserMap = {
  chromium: {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  chrome: {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  },
  msedge: {
    name: 'chromium',
    use: { ...devices['Desktop Edge'], channel: 'msedge' },
  },
  firefox: {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  webkit: {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
};

const targetBrowser = (execConfig.browser || 'chromium').toLowerCase();
const activeProject = browserMap[targetBrowser] || browserMap.chromium;

const resultsDir = path.join(baseAppPath, 'test-results');
const envFolder = process.env.ENV || 'default';
const htmlReportDir = path.join(resultsDir, `report-${envFolder}`);

const timeout = parseNumber(execConfig.timeout, 90000);
const retries = parseNumber(execConfig.retry, 0);
const workers = parseNumber(execConfig.parallel, 0);
const slowMo = parseNumber(execConfig.slowMo, 0);
const viewportWidth = parseNumber(execConfig.viewportWidth, 1280);
const viewportHeight = parseNumber(execConfig.viewportHeight, 720);
const headless = parseBoolean(execConfig.headless, true);
const screenshot = parseMode(execConfig.screenshot, ['off', 'on', 'only-on-failure'], 'only-on-failure');
const video = parseMode(execConfig.video, ['off', 'on', 'retain-on-failure', 'on-first-retry'], 'retain-on-failure');
const trace = parseMode(execConfig.trace, ['off', 'on', 'retain-on-failure', 'on-first-retry'], 'retain-on-failure');

const bddTestDir = defineBddConfig({
  features: `${baseAppPath}/test-results/generated-features/**/*.feature`,
  steps: [
    `${baseAppPath}/src/step-definitions/**/*.js`,
    `${baseAppPath}/src/support/**/*.js`,
  ],
  outputDir: `${baseAppPath}/.features-gen`
});

const sharedUse = {
  baseURL: uiConfig.baseUrl,
  headless,
  screenshot,
  video,
  trace,
  viewport: { width: viewportWidth, height: viewportHeight },
  launchOptions: { slowMo }
};

export default defineConfig({
  // Folder for test artifacts (screenshots, traces, videos, etc.)
  outputDir: path.join(baseAppPath, 'test-results', 'playwright-artifacts'),

  // Timeout for each test in milliseconds
  timeout,

  // Run all tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries,

  // Workers
  workers: workers > 0 ? workers : undefined,

  // Reporter to use — output to test-results/report-{ENV}/
  reporter: [
    ['list'],
    ['html', { outputFolder: htmlReportDir, open: 'never' }]
  ],

  metadata: {
    APP: process.env.APP || '',
    ENV: process.env.ENV || '',
    BROWSER: execConfig.browser || '',
    HEADLESS: headless,
    SLOW_MO: slowMo,
    PARALLEL: workers,
    TIMEOUT: timeout,
    VIEWPORT_WIDTH: viewportWidth,
    VIEWPORT_HEIGHT: viewportHeight,
    RETRY: retries,
    LOGGER: process.env.LOGGER || '',
    MOCK_RECORD: process.env.MOCK_RECORD || '',
    MOCK_PLAYBACK: process.env.MOCK_PLAYBACK || '',
    SCREENSHOT: screenshot,
    VIDEO: video,
    TRACE: trace
  },

  // Shared use settings
  use: sharedUse,

  // Playwright Projects — one for BDD (features) and one for Hybrid (spec files)
  projects: [
    {
      // BDD tests — testDir MUST be the bddTestDir returned by defineBddConfig
      name: `bdd-${activeProject.name}`,
      testDir: bddTestDir,
      use: { ...sharedUse, ...activeProject.use }
    },
    {
      // Hybrid Playwright tests
      name: `hybrid-${activeProject.name}`,
      testDir: path.join(baseAppPath, 'src/test'),
      use: { ...sharedUse, ...activeProject.use }
    }
  ],
});

