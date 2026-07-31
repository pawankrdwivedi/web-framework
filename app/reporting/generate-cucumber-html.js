import path from 'path';
import fs from 'fs';

// Prefer qe-framework-core implementation when available
const corePath = path.join(process.cwd(), '..', 'qe-framework-core', 'reporting', 'generate-cucumber-html.js');
let generator = null;
if (fs.existsSync(corePath)) {
  const { pathToFileURL } = await import('url');
  generator = await import(pathToFileURL(corePath).href);
} else {
  // Fallback: dynamic import from installed package if present
  try {
    generator = await import('qe-framework-core/reporting/generate-cucumber-html.js');
  } catch (e) {
    throw new Error('Could not locate generate-cucumber-html implementation in qe-framework-core');
  }
}

export const generateCucumberHtmlReport = async (opts = {}) => {
  return generator.generateCucumberHtmlReport(opts);
};

export default { generateCucumberHtmlReport };
