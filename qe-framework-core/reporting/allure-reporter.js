import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import logger from '../logger/Logger.js';
import configManager from '../config/config-manager.js';
import { resolveFromAppRoot } from '../utils/path-resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AllureReporter Class
 * 
 * Handles Allure report customization including:
 * - Environment configuration
 * - Screenshot and video attachments
 * - Test metadata and parameters
 * - Execution statistics
 * - Report properties
 */
class AllureReporter {
  constructor() {
    const resultsDir = 'test-results';
    this.allureResultsDir = resolveFromAppRoot(resultsDir, 'allure-results');
    this.environmentFile = path.join(this.allureResultsDir, 'environment.properties');
    this.initializeReporting();
  }

  /**
   * Initialize reporting by setting up directories and environment properties
   */
  initializeReporting() {
    try {
      // Ensure Allure results directory exists
      if (!fs.existsSync(this.allureResultsDir)) {
        fs.mkdirSync(this.allureResultsDir, { recursive: true });
        logger.info(`Created Allure results directory: ${this.allureResultsDir}`);
      }

      // Write environment properties
      this.writeEnvironmentProperties();
      logger.info('Allure reporting initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Allure reporting: ${error.message}`);
    }
  }

  /**
   * Write environment properties to environment.properties file
   * This file is read by Allure and displayed in the report
   */
  writeEnvironmentProperties() {
    try {
      const properties = this.buildEnvironmentProperties();
      const propertiesContent = this.formatProperties(properties);
      
      fs.writeFileSync(this.environmentFile, propertiesContent, 'utf8');
      logger.info(`Environment properties written to ${this.environmentFile}`);
    } catch (error) {
      logger.error(`Failed to write environment properties: ${error.message}`);
    }
  }

  /**
   * Build environment properties object from configuration and system info
   * Only includes: Application, Environment, Browser, Base UI URL, Base API URL
   */
  buildEnvironmentProperties() {
    const execConfig = configManager.getExecutionConfig();
    const uiConfig = configManager.getUiConfig();
    const apiConfig = configManager.getApiConfig();

    return {
      'Application': process.env.APP || configManager.getApplication(),
      'Environment': configManager.getEnvironment().toUpperCase(),
      'Browser': (execConfig?.browser || 'chromium').toUpperCase(),
      'URL': uiConfig?.baseUrl || apiConfig?.baseUrl || 'N/A',
    };
  }

  /**
   * Format properties object into Allure properties format
   * Format: key=value (one per line)
   */
  formatProperties(properties) {
    return Object.entries(properties)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }

  /**
   * Attach a screenshot to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} name - Name/description for the attachment
   */
  async attachScreenshot(world, name = 'Screenshot') {
    try {
      if (world && world.attach && world.page) {
        const screenshotBuffer = await world.page.screenshot({ fullPage: true });
        if (screenshotBuffer) {
          world.attach(screenshotBuffer, 'image/png');
          logger.info(`Screenshot attached: ${name}`);
          return true;
        }
      }
    } catch (error) {
      logger.error(`Failed to attach screenshot: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach a video file to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} videoPath - Path to video file
   * @param {string} name - Name/description for the attachment
   */
  async attachVideo(world, videoPath, name = 'Video Recording') {
    try {
      if (world && world.attach && videoPath && fs.existsSync(videoPath)) {
        const videoBuffer = fs.readFileSync(videoPath);
        world.attach(videoBuffer, 'video/mp4');
        logger.info(`Video attached: ${name} (${videoPath})`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach video: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach a trace file to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} tracePath - Path to trace file
   * @param {string} name - Name/description for the attachment
   */
  async attachTrace(world, tracePath, name = 'Trace') {
    try {
      if (world && world.attach && tracePath && fs.existsSync(tracePath)) {
        const traceBuffer = fs.readFileSync(tracePath);
        world.attach(traceBuffer, 'application/zip');
        logger.info(`Trace attached: ${name} (${tracePath})`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach trace: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach a file (any type) to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} filePath - Path to file
   * @param {string} mimeType - MIME type of the file
   * @param {string} name - Name/description for the attachment
   */
  async attachFile(world, filePath, mimeType, name = 'Attachment') {
    try {
      if (world && world.attach && filePath && fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        world.attach(fileBuffer, mimeType);
        logger.info(`File attached: ${name} (${filePath})`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach file: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach text content to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} content - Text content to attach
   * @param {string} name - Name/description for the attachment
   */
  attachText(world, content, name = 'Text Report') {
    try {
      if (world && world.attach && content) {
        world.attach(content, 'text/plain');
        logger.info(`Text attachment added: ${name}`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach text: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach JSON content to the Allure report
   * @param {World} world - Cucumber world object
   * @param {object} jsonData - JSON object to attach
   * @param {string} name - Name/description for the attachment
   */
  attachJson(world, jsonData, name = 'JSON Report') {
    try {
      if (world && world.attach && jsonData) {
        const jsonContent = JSON.stringify(jsonData, null, 2);
        world.attach(jsonContent, 'application/json');
        logger.info(`JSON attachment added: ${name}`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach JSON: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach HTML content to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} htmlContent - HTML content to attach
   * @param {string} name - Name/description for the attachment
   */
  attachHtml(world, htmlContent, name = 'HTML Report') {
    try {
      if (world && world.attach && htmlContent) {
        world.attach(htmlContent, 'text/html');
        logger.info(`HTML attachment added: ${name}`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach HTML: ${error.message}`);
    }
    return false;
  }

  /**
   * Attach CSV content to the Allure report
   * @param {World} world - Cucumber world object
   * @param {string} csvContent - CSV content to attach
   * @param {string} name - Name/description for the attachment
   */
  attachCsv(world, csvContent, name = 'CSV Report') {
    try {
      if (world && world.attach && csvContent) {
        world.attach(csvContent, 'text/csv');
        logger.info(`CSV attachment added: ${name}`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach CSV: ${error.message}`);
    }
    return false;
  }

  /**
   * Add scenario metadata/parameters to the report
   * @param {World} world - Cucumber world object
   * @param {object} parameters - Key-value pairs of parameters
   */
  addParameters(world, parameters) {
    try {
      if (world && world.attach && parameters) {
        const parametersList = Object.entries(parameters)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        world.attach(parametersList, 'text/plain');
        logger.debug(`Parameters added to report: ${JSON.stringify(parameters)}`);
        return true;
      }
    } catch (error) {
      logger.error(`Failed to add parameters: ${error.message}`);
    }
    return false;
  }

  /**
   * Create a test summary report
   * @param {World} world - Cucumber world object
   * @param {object} summary - Summary data
   */
  createTestSummary(world, summary = {}) {
    try {
      const summaryReport = {
        'Test Name': summary.testName || 'N/A',
        'Status': summary.status || 'UNKNOWN',
        'Duration (ms)': summary.duration || 0,
        'Started At': summary.startTime ? new Date(summary.startTime).toISOString() : 'N/A',
        'Completed At': summary.endTime ? new Date(summary.endTime).toISOString() : 'N/A',
        'Environment': configManager.getEnvironment().toUpperCase(),
        'Application': configManager.getApplication(),
        'Browser': configManager.getExecutionConfig()?.browser || 'N/A',
        'User': process.env.USER || process.env.USERNAME || 'N/A',
        'Machine': os.hostname(),
        ...summary,
      };

      const summaryContent = JSON.stringify(summaryReport, null, 2);
      this.attachJson(world, summaryReport, 'Test Summary');
      return true;
    } catch (error) {
      logger.error(`Failed to create test summary: ${error.message}`);
    }
    return false;
  }

  /**
   * Capture and attach browser console logs
   * @param {World} world - Cucumber world object
   * @param {Array} consoleLogs - Array of console log entries
   */
  attachConsoleLogs(world, consoleLogs = []) {
    try {
      if (world && world.attach && consoleLogs && consoleLogs.length > 0) {
        const logsContent = consoleLogs
          .map(log => `[${log.type.toUpperCase()}] ${log.text}`)
          .join('\n');
        this.attachText(world, logsContent, 'Console Logs');
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach console logs: ${error.message}`);
    }
    return false;
  }

  /**
   * Capture and attach network requests/responses
   * @param {World} world - Cucumber world object
   * @param {Array} networkLogs - Array of network request/response data
   */
  attachNetworkLogs(world, networkLogs = []) {
    try {
      if (world && world.attach && networkLogs && networkLogs.length > 0) {
        const networkContent = networkLogs
          .map(req => `${req.method} ${req.url} - ${req.status}`)
          .join('\n');
        this.attachText(world, networkContent, 'Network Requests');
        return true;
      }
    } catch (error) {
      logger.error(`Failed to attach network logs: ${error.message}`);
    }
    return false;
  }

  /**
   * Get current test metadata
   */
  getTestMetadata() {
    return {
      application: configManager.getApplication(),
      environment: configManager.getEnvironment(),
      executionConfig: configManager.getExecutionConfig(),
      uiConfig: configManager.getUiConfig(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    };
  }

  /**
   * Create a custom report file in Allure results directory
   * @param {string} filename - Name of the file
   * @param {string} content - File content
   * @param {boolean} isJson - Whether to format as JSON
   */
  writeCustomReport(filename, content, isJson = false) {
    try {
      const filepath = path.join(this.allureResultsDir, filename);
      const fileContent = isJson ? JSON.stringify(content, null, 2) : content;
      fs.writeFileSync(filepath, fileContent, 'utf8');
      logger.info(`Custom report written: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Failed to write custom report: ${error.message}`);
    }
    return false;
  }

  /**
   * Add test retry information to report
   * @param {World} world - Cucumber world object
   * @param {number} retryCount - Current retry attempt
   * @param {number} maxRetries - Maximum retries
   */
  addRetryInfo(world, retryCount, maxRetries) {
    try {
      if (world && world.attach) {
        const retryInfo = `Retry Attempt: ${retryCount + 1} of ${maxRetries + 1}`;
        this.attachText(world, retryInfo, 'Retry Information');
        return true;
      }
    } catch (error) {
      logger.error(`Failed to add retry info: ${error.message}`);
    }
    return false;
  }

  /**
   * Clean up old Allure results (optional)
   */
  cleanupOldResults() {
    try {
      if (fs.existsSync(this.allureResultsDir)) {
        fs.rmSync(this.allureResultsDir, { recursive: true, force: true });
        fs.mkdirSync(this.allureResultsDir, { recursive: true });
        logger.info('Old Allure results cleaned up');
        return true;
      }
    } catch (error) {
      logger.error(`Failed to cleanup old results: ${error.message}`);
    }
    return false;
  }

  /**
   * Export the generated Allure report to a combined interactive PDF and a static offline HTML directory.
   * This handles expanding all group tree nodes, extracting all testcase details panels,
   * rewriting navigation/hash links to local page containers, and applying specific styles for print/screen view.
   * 
   * @param {string} resultsDir - The test results directory (defaults to 'test-results')
   */
  async exportToPdf(resultsDir = 'test-results') {
    const { chromium } = await import('playwright');
    
    // Define absolute paths for input Allure report and output directories
    const reportDir = path.resolve(process.cwd(), resultsDir, 'reports/allure-report');
    const pdfDir = path.resolve(process.cwd(), resultsDir, 'pdf');
    const htmlResultsParentDir = path.resolve(process.cwd(), resultsDir, 'html_results');
    
    logger.info(`Starting Allure Report to PDF and Static HTML conversion...`);
    
    // Ensure output directories exist
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    if (!fs.existsSync(htmlResultsParentDir)) {
      fs.mkdirSync(htmlResultsParentDir, { recursive: true });
    }
    
    if (!fs.existsSync(reportDir)) {
      throw new Error(`Allure HTML report directory not found at: ${reportDir}`);
    }
    
    // Launch headless browser to process the report page
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Intercept requests to serve local Allure report assets over a virtual domain
    // to avoid CORS issues and let local AJAX requests load data files successfully.
    await page.route('http://allure-report/**', async (route) => {
      const url = route.request().url();
      const parsedUrl = new URL(url);
      let relativePath = decodeURIComponent(parsedUrl.pathname);
      if (relativePath === '/' || !relativePath) {
        relativePath = '/index.html';
      }
      const filePath = path.join(reportDir, relativePath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        await route.fulfill({ status: 200, path: filePath });
      } else {
        await route.fulfill({ status: 404, body: 'Not Found' });
      }
    });
    
    // 1. Load the Overview tab first to extract shared stylesheets from the page head
    await page.goto('http://allure-report/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Extract inline style tags and external stylesheet links from the page head
    const headHtml = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');
    });
    
    // Define the list of tabs we need to extract
    const tabs = [
      { name: 'overview', hash: '#/' },
      { name: 'categories', hash: '#/categories' },
      { name: 'suites', hash: '#/suites' },
      { name: 'behaviors', hash: '#/behaviors' },
      { name: 'packages', hash: '#/packages' },
      { name: 'graphs', hash: '#/graph' },
      { name: 'timeline', hash: '#/timeline' }
    ];
    
    const extractedTabs = {};
    const extractedTestCases = {}; // Map of { tabName: { testCaseId: testCaseHtml } }
    
    // 2. Loop through each tab, expand trees if needed, and extract HTML content
    for (const tab of tabs) {
      logger.info(`Extracting Allure tab content: ${tab.name}...`);
      await page.goto('http://allure-report/index.html' + tab.hash, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // If it's a tree-structured tab, expand all collapsed group nodes recursively
      if (['suites', 'behaviors', 'packages'].includes(tab.name)) {
        extractedTestCases[tab.name] = {};
        
        let expandedAny = true;
        let iterations = 0;
        // Keep expanding until no collapsed group node titles are left or limit reached
        while (expandedAny && iterations < 50) {
          expandedAny = false;
          const collapsed = page.locator('.node:not(.node__expanded)[data-node-kind="group"] .node__title');
          if (await collapsed.count() > 0) {
            await collapsed.first().click();
            await page.waitForTimeout(200); // Wait for transition and lazy-loading
            expandedAny = true;
            iterations++;
          }
        }
        
        // Find all testcase links in the fully expanded tree list
        const testCaseLinks = await page.evaluate((tabName) => {
          return Array.from(document.querySelectorAll('a'))
            .map(a => ({
              text: a.innerText.trim(),
              href: a.getAttribute('href')
            }))
            .filter(x => x.href && x.href.includes('#' + tabName + '/'));
        }, tab.name);
        
        // Extract the detail panel content for each testcase found
        for (const tc of testCaseLinks) {
          const cleanRest = tc.href.replace(/^#(suites|behaviors|packages)\//, '').replace(/\/$/, '').replace(/\//g, '-');
          const tcId = `page-tc-${tab.name}-${cleanRest}`;
          
          logger.info(`Extracting ${tab.name} testcase detail: ${tc.href}`);
          
          // Navigate directly to the testcase details view
          await page.goto('http://allure-report/index.html' + tc.href, { waitUntil: 'networkidle' });
          await page.waitForTimeout(500);
          
          // Wait for the testcase detail view to render on the right side
          await page.waitForSelector('.test-result, .pane__title', { state: 'attached', timeout: 5000 });
          
          // Extract the details pane HTML
          const tcHtml = await page.evaluate(() => {
            const rightPane = document.querySelector('.side-by-side__right');
            return rightPane ? rightPane.innerHTML : '';
          });
          
          extractedTestCases[tab.name][tcId] = tcHtml;
        }
        
        // Return to the tab root and re-expand the tree to capture the final left-pane tree HTML
        await page.goto('http://allure-report/index.html' + tab.hash, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        
        expandedAny = true;
        iterations = 0;
        while (expandedAny && iterations < 50) {
          expandedAny = false;
          const collapsed = page.locator('.node:not(.node__expanded)[data-node-kind="group"] .node__title');
          if (await collapsed.count() > 0) {
            await collapsed.first().click();
            await page.waitForTimeout(200);
            expandedAny = true;
            iterations++;
          }
        }
      }
      
      // Capture the main content HTML for the tab
      const contentHtml = await page.evaluate(() => {
        const content = document.querySelector('#content');
        return content ? content.innerHTML : '';
      });
      
      extractedTabs[tab.name] = contentHtml;
    }
    
    // 3. Compile the single-page interactive HTML report by combining all extracted tabs
    let pagesHtml = '';
    
    // Helper to rewrite links inside the HTML content
    const rewriteHtmlLinks = (html) => {
      let result = html;
      // Map main tab navigation bar links
      result = result.replace(/href="#"/g, 'href="#page-overview"');
      result = result.replace(/href="#categories"/g, 'href="#page-categories"');
      result = result.replace(/href="#suites"/g, 'href="#page-suites"');
      result = result.replace(/href="#behaviors"/g, 'href="#page-behaviors"');
      result = result.replace(/href="#packages"/g, 'href="#page-packages"');
      result = result.replace(/href="#graph"/g, 'href="#page-graphs"');
      result = result.replace(/href="#timeline"/g, 'href="#page-timeline"');
      
      // Map tree leaf testcase hash routes to local anchor IDs
      result = result.replace(/href="#(suites|behaviors|packages)\/([^"]+)"/g, (match, tab, rest) => {
        const cleanRest = rest.replace(/\/$/, '').replace(/\//g, '-');
        return `href="#page-tc-${tab}-${cleanRest}"`;
      });
      return result;
    };
    
    // Compile each tab's container
    for (const tabName of Object.keys(extractedTabs)) {
      let tabHtml = extractedTabs[tabName];
      
      // For split-pane tree tabs, inject the individual testcase detail panels inside the right pane container
      if (['suites', 'behaviors', 'packages'].includes(tabName)) {
        let testCasesHtml = `
          <div class="empty-view-placeholder empty-view">
            <p class="empty-view__message">No item selected</p>
          </div>
        `;
        
        const tabTCs = extractedTestCases[tabName];
        for (const [tcId, tcHtml] of Object.entries(tabTCs)) {
          testCasesHtml += `
            <div class="test-case-detail" id="${tcId}" style="display: none;">
              ${tcHtml}
            </div>
          `;
        }
        
        // Inject the compiled test case detail divs into the right-hand panel of the split screen
        tabHtml = tabHtml.replace(/<div[^>]*class="[^"]*side-by-side__right[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/, (match) => {
          return `<div class="side-by-side__right">${testCasesHtml}</div></div>`;
        });
      }
      
      // Rewrite links and wrap the tab HTML in a page container
      const rewrittenTabHtml = rewriteHtmlLinks(tabHtml);
      pagesHtml += `
        <div class="allure-page-container" id="page-${tabName}">
          ${rewrittenTabHtml}
        </div>
      `;
    }
    
    // Construct the complete HTML document including overrides, routing, and styling
    const finalHtml = `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <title>Allure Interactive Offline Report</title>
  ${headHtml}
  <style>
    /* Base wrapper for tab container pages */
    .allure-page-container {
      display: none;
      width: 100%;
      height: 100%;
    }
    
    /* Display overview by default */
    #page-overview {
      display: block;
    }
    
    /* Interactive viewport styling in screen mode */
    @media screen {
      html, body {
        margin: 0;
        padding: 0;
        height: 100vh;
        overflow: hidden;
      }
      #content {
        height: 100vh;
        display: block;
      }
      .app {
        height: 100vh;
        display: flex !important;
        flex-direction: row !important;
      }
      .app__nav {
        width: 80px;
        height: 100vh;
        flex-shrink: 0;
      }
      .app__content {
        flex: 1;
        height: 100vh;
        overflow: hidden;
      }
      .allure-page-container {
        height: 100vh;
        overflow: hidden;
      }
      .side-by-side {
        display: flex !important;
        height: 100vh;
      }
      .side-by-side__left {
        width: 40% !important;
        height: 100% !important;
        overflow-y: auto !important;
        flex-shrink: 0;
      }
      .side-by-side__right {
        width: 60% !important;
        height: 100% !important;
        overflow-y: auto !important;
      }
      .test-case-detail {
        display: none;
      }
    }
    
    /* Sequential printable document styling in print/PDF mode */
    @media print {
      .app__nav {
        display: none !important;
      }
      .app__content {
        width: 100% !important;
        overflow: visible !important;
      }
      .allure-page-container {
        display: block !important;
        page-break-before: always !important;
        page-break-inside: avoid !important;
        overflow: visible !important;
        height: auto !important;
      }
      .side-by-side {
        display: block !important;
        height: auto !important;
      }
      .side-by-side__left {
        width: 100% !important;
        display: block !important;
        page-break-after: always !important;
        overflow: visible !important;
        height: auto !important;
      }
      .side-by-side__right {
        width: 100% !important;
        display: block !important;
        overflow: visible !important;
        height: auto !important;
      }
      .test-case-detail {
        display: block !important;
        page-break-before: always !important;
        page-break-inside: avoid !important;
        height: auto !important;
        overflow: visible !important;
      }
      .empty-view-placeholder {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div id="content">
    ${pagesHtml}
  </div>
  
  <script>
    // Lightweight client-side router for the offline single-page HTML report
    function handleRouting() {
      const hash = window.location.hash || '#page-overview';
      
      // 1. Navigation between main tabs
      if (hash.startsWith('#page-') && !hash.includes('-tc-')) {
        document.querySelectorAll('.allure-page-container').forEach(el => el.style.display = 'none');
        const activePage = document.querySelector(hash);
        if (activePage) {
          activePage.style.display = 'block';
        }
        
        // Toggle the active styling of the side navigation bar links
        document.querySelectorAll('.side-nav__item').forEach(el => {
          el.classList.remove('side-nav__item_active');
          const link = el.querySelector('a');
          if (link && link.getAttribute('href') === hash) {
            el.classList.add('side-nav__item_active');
          }
        });
      } 
      // 2. Navigation to specific test case detail panels
      else if (hash.startsWith('#page-tc-')) {
        const parts = hash.split('-');
        const tabName = parts[2]; // Extract tab name (suites, behaviors, packages)
        
        // Display the corresponding tab container first
        document.querySelectorAll('.allure-page-container').forEach(el => el.style.display = 'none');
        const activePage = document.querySelector('#page-' + tabName);
        if (activePage) {
          activePage.style.display = 'block';
        }
        
        // Display the target testcase panel inside the right pane, hiding others
        const rightPanel = activePage ? activePage.querySelector('.side-by-side__right') : null;
        if (rightPanel) {
          rightPanel.querySelectorAll('.test-case-detail').forEach(el => el.style.display = 'none');
          const activeDetail = rightPanel.querySelector(hash);
          if (activeDetail) {
            activeDetail.style.display = 'block';
            // Hide the default empty view placeholder
            const placeholder = rightPanel.querySelector('.empty-view-placeholder');
            if (placeholder) placeholder.style.display = 'none';
          }
        }
        
        // Highlight corresponding tab side nav menu item
        document.querySelectorAll('.side-nav__item').forEach(el => {
          el.classList.remove('side-nav__item_active');
          const link = el.querySelector('a');
          if (link && link.getAttribute('href') === '#page-' + tabName) {
            el.classList.add('side-nav__item_active');
          }
        });
      }
    }
    
    // Register routing event listeners
    window.addEventListener('hashchange', handleRouting);
    window.addEventListener('load', handleRouting);
  </script>
</body>
</html>
    `;
    
    // Write temporary HTML report to the Allure directory to allow relative path generation
    const tempCombinedPath = path.join(reportDir, 'temp_combined.html');
    fs.writeFileSync(tempCombinedPath, finalHtml, 'utf8');
    
    // 4. Print the compiled HTML layout to PDF using Playwright
    logger.info(`Compiling multi-page Allure PDF report...`);
    const date = new Date();
    const formattedDate = date.toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
    const pdfPath = path.join(pdfDir, `Report_${formattedDate}.pdf`);
    
    // Navigate headless browser to the temporary page served via virtual host
    await page.goto('http://allure-report/temp_combined.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Output the PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' }
    });
    
    // Clean up temporary HTML file
    if (fs.existsSync(tempCombinedPath)) {
      fs.unlinkSync(tempCombinedPath);
    }
    
    // 5. Save the static interactive offline HTML report directory
    const htmlResultsDir = path.join(htmlResultsParentDir, `result_${formattedDate}`);
    fs.mkdirSync(htmlResultsDir, { recursive: true });
    
    // Write the main static index.html file
    fs.writeFileSync(path.join(htmlResultsDir, 'index.html'), finalHtml, 'utf8');
    
    // Recursively copy Allure asset directories so the offline HTML is self-contained
    const copyFolderSync = (from, to) => {
      if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
      }
      const items = fs.readdirSync(from);
      for (const item of items) {
        const fromPath = path.join(from, item);
        const toPath = path.join(to, item);
        if (fs.lstatSync(fromPath).isDirectory()) {
          copyFolderSync(fromPath, toPath);
        } else {
          fs.copyFileSync(fromPath, toPath);
        }
      }
    };
    
    // Copy necessary asset subfolders
    const assetFolders = ['assets', 'data', 'export', 'history', 'widgets'];
    for (const folder of assetFolders) {
      const srcFolder = path.join(reportDir, folder);
      if (fs.existsSync(srcFolder)) {
        copyFolderSync(srcFolder, path.join(htmlResultsDir, folder));
      }
    }
    
    logger.info(`Allure PDF Report generated successfully: ${pdfPath}`);
    logger.info(`Offline HTML Report saved successfully: ${path.join(htmlResultsDir, 'index.html')}`);
    
    await browser.close();
  }
}

// Export singleton instance
export default new AllureReporter();
