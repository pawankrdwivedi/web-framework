import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import xlsx from 'xlsx';

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
const currentDir = process.cwd();

// Load basic .env first so we can check if APP is defined
try {
  const localEnvPath = path.join(currentDir, '.env');
  if (fs.existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath });
  }
} catch (e) {
  // Ignore
}

// Determine where the application lives. Support two modes:
// 1) Running inside the application folder (legacy behavior)
// 2) Running from the framework root with `APP` env var set to the app subfolder (new)
const appFolderName = process.env.APP || path.basename(currentDir);
const runningFromAppFolder = path.basename(currentDir) === appFolderName && fs.existsSync(path.join(currentDir, 'package.json'));
const runningFromFrameworkRootWithApp = process.env.APP && fs.existsSync(path.join(currentDir, appFolderName, 'package.json'));

if (!runningFromAppFolder && !runningFromFrameworkRootWithApp) {
  console.error(`\n❌ Error: Test execution must be run either from inside the application folder ("${appFolderName}") or from the framework root with APP=${appFolderName}.`);
  console.error(`Please change your directory to the application folder or set APP to a valid subfolder and run again.\n`);
  process.exit(1);
}

// Resolve the actual application root (where source files live). When running from the framework
// root with APP set, `appRoot` points to the subfolder; otherwise it is the current working dir.
const appRoot = runningFromFrameworkRootWithApp ? path.join(currentDir, appFolderName) : currentDir;

// Load other environment variables related to the app (search common locations)
try {
  const searchPaths = [
    path.join(appRoot, '.env'),
    path.join(currentDir, `${appFolderName}.env`),
    path.join(appRoot, `${appFolderName}.env`)
  ];
  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    }
  }
} catch (e) {
  // Ignore
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let env = process.env.ENV || 'sit-01'; // default environment
let application = process.env.APP || undefined; // no default application
const cleanArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--env=')) {
    env = arg.split('=')[1];
  } else if (arg === '--env' && i + 1 < args.length) {
    env = args[i + 1];
    i++; // skip next element
  } else if (arg.startsWith('--app=')) {
    application = arg.split('=')[1];
  } else if (arg === '--app' && i + 1 < args.length) {
    application = args[i + 1];
    i++; // skip next element
  } else {
    cleanArgs.push(arg);
  }
}

// Map command-line parsed overrides to standard environment variables for ConfigManager
if (env) process.env.TEST_ENV = env;
if (application) process.env.APPLICATION = application;
console.log(`[Runner] Targeting Environment: ${env ? env.toUpperCase() : 'NONE'}`);
console.log(`[Runner] Targeting Application: ${application ? application.toUpperCase() : 'NONE'}`);

const resultsDir = 'test-results';
const logsDir = 'test-logs';

const isLoggerEnabled = String(process.env.LOGGER || '').trim().toLowerCase() === 'true';

// Clean previous logs
const logsPath = path.join(appRoot, logsDir);
if (isLoggerEnabled && fs.existsSync(logsPath)) {
  try {
    const files = fs.readdirSync(logsPath);
    for (const file of files) {
      fs.rmSync(path.join(logsPath, file), { recursive: true, force: true });
    }
    console.log('[Runner] Cleared previous logs.');
  } catch (err) {
    console.warn(`[Runner] Warning: Could not clear previous logs: ${err.message}`);
  }
}

// Ensure required reports directories exist
const dirs = [
  path.join(resultsDir, 'reports/screenshots'),
  path.join(resultsDir, 'reports/videos'),
  path.join(resultsDir, 'reports/traces')
];

if (isLoggerEnabled) {
  dirs.push(logsDir);
}
dirs.forEach(dir => {
  const fullPath = path.join(appRoot, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Directory variables (resolve to the actual app source location when appRoot differs)
const _featuresDirRelative = path.relative(currentDir, path.join(appRoot, 'src', 'features')).replace(/\\/g, '/');
const _stepDefinitionsDir = path.relative(currentDir, path.join(appRoot, 'src', 'step-definitions')).replace(/\\/g, '/') || 'src/step-definitions';
const _supportDir = path.relative(currentDir, path.join(appRoot, 'src', 'support')).replace(/\\/g, '/') || 'src/support';
// CLI paths (relative to the app root when the runner spawns the test processes with cwd=appRoot)
const stepDefinitionsCli = path.posix.join('src', 'step-definitions');
const supportDirCli = path.posix.join('src', 'support');
const normalizePath = value => value.replace(/\\/g, '/').replace(/\/+$/, '');
// When running tests, the test runner's working directory is set to the app root.
// Use the app-root relative path for feature discovery
const normalizedFeaturesDir = 'src/features';

const defaultArgs = [];
const _defaultFeatureGlob = `${normalizedFeaturesDir}/**/*.feature`;
const generatedFeaturesDir = path.join(appRoot, resultsDir, 'generated-features');

function findMatchingSheetName(workbook, sheetName) {
  return workbook.SheetNames.find(
    name => name.toLowerCase().replace(/_/g, '') === sheetName.toLowerCase().replace(/_/g, '')
  );
}

function getSheetNameForFeature(featureContent) {
  if (/user loads UI test data/i.test(featureContent)) return 'UI_test_data';
  if (/user loads API test data|customer test data/i.test(featureContent)) return 'API_test_data';
  if (/user loads ETL test data|ETL test data/i.test(featureContent)) return 'ETL_test_data';
  return null;
}

function formatExamplesTable(rows) {
  const headers = Object.keys(rows[0] || {});
  const tableRows = [headers, ...rows.map(row => headers.map(header => row[header]))];
  const widths = headers.map((_, index) =>
    Math.max(...tableRows.map(row => String(row[index] ?? '').length))
  );

  return tableRows
    .map(row => `      | ${row.map((value, index) => String(value ?? '').padEnd(widths[index])).join(' | ')} |`)
    .join('\n');
}

function expandFeatureExamplesFromExcel(featurePath, workbook) {
  const featureContent = fs.readFileSync(featurePath, 'utf8');
  const sheetName = getSheetNameForFeature(featureContent);
  if (!sheetName) return featureContent;

  const matchedSheetName = findMatchingSheetName(workbook, sheetName);
  if (!matchedSheetName) return featureContent;

  const rows = xlsx.utils.sheet_to_json(workbook.Sheets[matchedSheetName], { defval: '' });
  if (rows.length === 0) return featureContent;

  return featureContent.replace(
    /(^[ \t]*Examples:\s*\r?\n)([ \t]*\|[^\r\n]*TestCaseID[^\r\n]*\|\s*\r?\n)((?:[ \t]*\|[^\r\n]*\|\s*(?:\r?\n|$))+)/gim,
    (match, examplesLine, headerLine, bodyBlock) => {
      const testCaseIds = bodyBlock
        .trim()
        .split(/\r?\n/)
        .map(line => line.split('|').map(cell => cell.trim()).filter(Boolean)[0])
        .filter(Boolean);

      const selectedRows = testCaseIds.length === 1
        ? rows
        : rows.filter(row =>
          testCaseIds.some(id =>
            String(row.TestCaseID || row.testCaseId || row.testcaseid || '').trim().toLowerCase() === String(id).toLowerCase()
          )
        );

      if (selectedRows.length === 0) return match;
      return `${examplesLine}${formatExamplesTable(selectedRows)}\n`;
    }
  );
}

function collectFeatureFiles(rootDir) {
  const files = [];
  if (!fs.existsSync(rootDir)) return files;

  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFeatureFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.feature')) {
      files.push(entryPath);
    }
  }

  return files;
}

function prepareGeneratedFeatures() {
  const testDataDir = path.join(appRoot, 'src', 'test-data');
  const excelFileName = 'test-data.xlsx';
  const excelPath = path.join(testDataDir, excelFileName);
  const sourceFeaturesPath = path.join(appRoot, 'src', 'features');

  if (!fs.existsSync(excelPath) || !fs.existsSync(sourceFeaturesPath)) {
    return normalizedFeaturesDir || 'src/features';
  }

  if (fs.existsSync(generatedFeaturesDir)) {
    fs.rmSync(generatedFeaturesDir, { recursive: true, force: true });
  }
  fs.mkdirSync(generatedFeaturesDir, { recursive: true });

  const workbook = xlsx.readFile(excelPath);
  const featureFiles = collectFeatureFiles(sourceFeaturesPath);

  for (const featureFile of featureFiles) {
    const relativePath = path.relative(sourceFeaturesPath, featureFile);
    const targetPath = path.join(generatedFeaturesDir, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, expandFeatureExamplesFromExcel(featureFile, workbook), 'utf8');
  }

  console.log(`[Runner] Generated data-driven feature files in: ${generatedFeaturesDir}`);
  return path.relative(appRoot, generatedFeaturesDir).replace(/\\/g, '/');
}

prepareGeneratedFeatures();

// Convert tag arguments (@tag) to --grep filters for playwright-bdd
const finalPlaywrightArgs = [];

for (let i = 0; i < cleanArgs.length; i++) {
  const arg = cleanArgs[i];
  
  // Handle tags starting with @
  if (arg.startsWith('@')) {
    finalPlaywrightArgs.push('--grep', arg);
  }
  // Handle --grep arguments
  else if (arg === '--grep' && i + 1 < cleanArgs.length) {
    finalPlaywrightArgs.push('--grep', cleanArgs[i + 1]);
    i++; // Skip next element since we already processed it
  }
  // Handle file paths and other arguments
  else if (!arg.startsWith('--')) {
    finalPlaywrightArgs.push(arg);
  }
  // Pass other flags through
  else {
    finalPlaywrightArgs.push(arg);
  }
}

function runBddGen() {
  // Build bddgen args - always generate all specs, filtering happens in playwright test
  const bddgenArgs = ['bddgen', 'test'];

  return new Promise((resolve) => {
    console.log(`\n[Runner] --- Generating BDD spec files (bddgen) ---`);
    const bddgenProcess = spawn('npx', bddgenArgs, {
      stdio: 'inherit',
      shell: true,
      cwd: appRoot,
      env: {
        ...process.env,
        FORCE_COLOR: '1'
      }
    });

    bddgenProcess.on('close', (code) => {
      // Check if .features-gen was created
      const featuresGenPath = path.join(appRoot, '.features-gen');
      if (fs.existsSync(featuresGenPath)) {
        const files = fs.readdirSync(featuresGenPath);
        console.log(`[Runner] .features-gen directory created with ${files.length} files`);
      } else {
        console.warn(`[Runner] WARNING: .features-gen directory was not created by bddgen`);
      }
      
      if (code !== 0) {
        console.warn(`[Runner] bddgen exited with code ${code}. Continuing anyway...`);
      } else {
        console.log(`[Runner] BDD spec files generated successfully.\n`);
      }
      resolve(code);
    });
  });
}

function runTests() {
  return new Promise((resolve) => {
    console.log(`\n[Runner] --- Spawning Playwright Tests (Hybrid & BDD) ---`);
    console.log(`[Runner] Spawning Playwright CLI: npx playwright test ${finalPlaywrightArgs.join(' ')}`);
    const playwrightProcess = spawn('npx', ['playwright', 'test', ...finalPlaywrightArgs], {
      stdio: 'inherit',
      shell: true,
      cwd: appRoot,
      env: {
        ...process.env,
        FORCE_COLOR: '1'
      }
    });

    playwrightProcess.on('close', (code) => {
      console.log(`[Runner] Playwright execution finished with exit code ${code}\n`);
      resolve(code);
    });
  });
}

function cleanupGeneratedFeatures() {
  const featuresGenPath = path.join(appRoot, '.features-gen');
  if (fs.existsSync(featuresGenPath)) {
    try {
      fs.rmSync(featuresGenPath, { recursive: true, force: true });
      console.log(`[Runner] Cleaned up generated features directory: ${featuresGenPath}`);
    } catch (err) {
      console.warn(`[Runner] Warning: Could not clean up .features-gen directory: ${err.message}`);
    }
  }
}

async function main() {
  await runBddGen();
  const code = await runTests();
  
  // Clean up .features-gen folder after test execution completes
  // Only clean if tests were found and executed (exit code 0 or exit code from failed tests)
  // Don't clean if exit code is 1 from "No tests found" error
  if (code !== 1 || !fs.existsSync(path.join(appRoot, '.features-gen'))) {
    cleanupGeneratedFeatures();
  }
  
  console.log(`[Runner] Global test run completed with final exit code: ${code}`);
  process.exit(code);
}

main().catch(err => {
  console.error('[Runner] Unexpected error during execution:', err);
  process.exit(1);
});
}

