import fs from 'fs';
import path from 'path';
import logger from '../logger/Logger.js';
import configManager from '../config/config-manager.js';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

export async function generateCucumberHtmlReport(opts = {}) {
  try {
    const appRoot = opts.appRoot || process.cwd();
    const resultsDir = opts.resultsDir || 'test-results';
    const jsonFile = path.join(appRoot, resultsDir, 'reports', 'cucumber-report.json');
    const htmlFile = path.join(appRoot, resultsDir, 'reports', 'cucumber-report.html');

    if (!fs.existsSync(jsonFile)) {
      logger.warn(`[CucumberHTML] JSON results not found: ${jsonFile}`);
      return false;
    }

    const execConfig = configManager.getExecutionConfig();

    const attachments = [];
    const screenshotEnabled = String(process.env.SCREENSHOT || execConfig?.screenshot || '').toLowerCase() !== 'off';
    const videoEnabled = String(process.env.VIDEO || execConfig?.video || '').toLowerCase() !== 'off';
    const traceEnabled = String(process.env.TRACE || execConfig?.trace || '').toLowerCase() !== 'off';

    const rel = (p) => path.relative(appRoot, p).replace(/\\/g, '/');

    if (screenshotEnabled) attachments.push({ label: 'Screenshots', value: rel(path.join(appRoot, resultsDir, 'reports', 'screenshots')) });
    if (videoEnabled) attachments.push({ label: 'Videos', value: rel(path.join(appRoot, resultsDir, 'reports', 'videos')) });
    if (traceEnabled) attachments.push({ label: 'Traces', value: rel(path.join(appRoot, resultsDir, 'reports', 'traces')) });

    const options = {
      theme: 'bootstrap',
      jsonFile,
      output: htmlFile,
      reportSuiteAsScenarios: true,
      launchReport: false,
      metadata: {
        'Application': process.env.APP || configManager.getApplication(),
        'Environment': configManager.getEnvironment(),
        'Browser': execConfig?.browser || 'N/A'
      },
      customData: {
        title: 'Attachments',
        data: attachments
      }
    };

    // Resolve and require `cucumber-html-reporter` from the app's node_modules
    try {
      const require = createRequire(path.join(appRoot, 'package.json'));
      try {
        const reporterImpl = require('cucumber-html-reporter');
        if (typeof reporterImpl.generate !== 'function') {
          throw new Error('cucumber-html-reporter does not expose a generate() function');
        }
        reporterImpl.generate(options);
        logger.info(`[CucumberHTML] Generated HTML report: ${htmlFile}`);
        return true;
      } catch (implErr) {
        logger.warn(`[CucumberHTML] cucumber-html-reporter failed: ${implErr.message}`);
        throw implErr;
      }
    } catch (e) {
      // If the external reporter is not available, produce a minimal HTML summary
      logger.warn('[CucumberHTML] External reporter not available, generating fallback HTML summary');
      try {
        const raw = fs.readFileSync(jsonFile, 'utf8');
        const data = JSON.parse(raw);
        const scenarios = [];
        for (const feature of data) {
          const elems = feature.elements || [];
          for (const el of elems) {
            const scenarioName = el.name || 'Unnamed';
            const status = (el.steps || []).some(s => s.result && s.result.status === 'failed') ? 'failed' : 'passed';
            scenarios.push({ feature: feature.name || 'Feature', scenario: scenarioName, status });
          }
        }
        const attachmentsHtml = [];
        if (attachments.length) {
          for (const a of attachments) {
            attachmentsHtml.push(`<li><strong>${a.label}</strong>: <a href="${a.value}">${a.value}</a></li>`);
          }
        }
        const html = `<!doctype html><html><head><meta charset="utf-8"><title>Cucumber Summary</title></head><body><h1>Cucumber Report</h1><h2>Scenarios</h2><ul>${scenarios.map(s=>`<li>${s.status.toUpperCase()}: ${s.feature} - ${s.scenario}</li>`).join('')}</ul><h3>Attachments</h3><ul>${attachmentsHtml.join('') || '<li>None</li>'}</ul></body></html>`;
        fs.mkdirSync(path.dirname(htmlFile), { recursive: true });
        fs.writeFileSync(htmlFile, html, 'utf8');
        logger.info(`[CucumberHTML] Generated fallback HTML report: ${htmlFile}`);
        return true;
      } catch (err2) {
        throw new Error(`Failed to generate fallback HTML report: ${err2.message}`);
      }
    }
    logger.info(`[CucumberHTML] Generated HTML report: ${htmlFile}`);
    return true;
  } catch (err) {
    logger.error(`[CucumberHTML] Failed to generate HTML report: ${err.message}`);
    return false;
  }
}

export default { generateCucumberHtmlReport };
