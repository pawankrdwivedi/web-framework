# QE Framework Core (`qe-framework-core`)

This is the reusable, application-agnostic **core automation engine** for the enterprise test suite. It houses all low-level operational layers, including Playwright browser management, API wrappers, database drivers, mock servers, soft assertions, and high-speed ETL reconciliation engines.

To protect core framework assets and simplify client installations, this package is bundled, minified, and distributed as a tarball dependency (`qe-framework-core-1.0.0.tgz`) for consumer test suites (such as the one in the `app/` folder).

---

## 🛠️ Key Architectural Modules

The core is structured into highly cohesive, dedicated packages:


### 2. `api/` — API Client Wrapper
Provides an Axios-based HTTP client wrapper supporting custom configurations, unified logging, and built-in **AJV (JSON Schema)** validation to enforce response payload contracts.

### 3. `assertions/` — Robust Soft Assertions
Implements a custom assertion layer featuring a `SoftAssert` utility. This allows tests to evaluate multiple verification checkpoints in a single run, collecting all mismatches and only throwing a failure at the end of the test.

### 4. `browser/` — Browser Context & Playwright Helpers
- **BrowserManager**: Provisions browser pages, captures execution artifacts (screenshots, network logs, console messages, Playwright trace files), and implements self-healing element locators.
- **AngularHelper**: Integrates with Angular's `Zone.js` indicators via `window.getAllAngularTestabilities()` to automatically pause executions until async UI operations stabilize.

### 5. `config/` — Configuration Engine
Parses and loads common settings (`.env`) and environment-specific variables (`config/<env>.yaml`), resolving endpoints, credentials, and trace tolerances.

### 6. `data/` — Data Readers, Generators & Runtime Store
- **ExcelReader**: Reads Excel workbook rows, matching specific `Scenario Outline` identifiers to spreadsheet data based on the active test environment.
- **TestAssetGenerator**: Automatically generates structured Excel sheets and CSV mock data defined in asset metadata on suite initialization.
- **RuntimeDataManager**: A process-level singleton key/value store that persists data across Cucumber scenarios, enabling one scenario to produce data that subsequent scenarios can consume at runtime.

### 7. `db/` — Unified Database Client
A standard SQL connection pool interface supporting Postgres (`pg`), MySQL (`mysql2`), Oracle (`oracledb`), and MSSQL (`tedious`). Supports a dynamic **Mock Fallback Mode** to return static mocked datasets when database servers are offline or executing in a local test context.

### 8. `etl/` — ETL Verification Engine
A high-performance reconciliation engine that verifies:
- File record line counts.
- Cell-by-cell row mismatches mapped against primary keys.
- Mathematical column aggregate matches (e.g., verifying `SUM`, `AVG`, `MIN`, `MAX` values).

### 9. `mock/` — Mocking & Service Interception
Implements Mountebank-powered service virtualization for backend API mocking, allowing UI test suites to execute independently of actual server states.

#### API record/playback

`qe-framework-core` can now orchestrate a local Mountebank server and imposter lifecycle via `networkRecordPlaybackManager`.

Environment variables:

- `MOCK_RECORD=true` for proxy recording mode
- `MOCK_PLAYBACK=true` for playback mode

Recorded imposters are saved under:

`app/test_data_mock_data/mountebank-imposter-<scenario>.json`

### 10. `pages/` — Base Page Objects
Provides base POM classes (e.g., `BasePage`) that wrap standard Playwright actions (click, fill, hover, navigation) with built-in logging, wait states, and self-healing locator fallbacks.

### 11. `reporting/` — Reporting Adapters
Adapts execution hooks to compile and bundle test logs, screenshots, and videos directly into unified HTML and Allure reports.

---

## 📦 Bundling & Packaging the Core

The core framework is compiled and packaged into a tarball to be installed by other packages:

1. **Install Dependencies**:
   ```bash
   cd qe-framework-core
   npm install
   ```
2. **Build the Core Bundle**:
   Compiles and minifies the code (e.g., using `esbuild`):
   ```bash
   npm run build
   ```
3. **Pack the Bundle**:
   Compresses and wraps the build assets into a `.tgz` file:
   ```bash
   npm run pack
   ```
   This generates `qe-framework-core-1.0.0.tgz` in the package root.

---

## 🔌 Import Usage Guide

Once `qe-framework-core` is linked as an npm dependency inside a consumer application, you can import its components directly:

```javascript
import { 
  BasePage, 
  SoftAssert, 
  PlaywrightAssertions,
  ApiClient, 
  dbClient, 
  logger, 
  configManager,
  runtimeDataManager
} from 'qe-framework-core';

// Example: Using Soft Assertions
const assert = new SoftAssert();
assert.assertEquals(actualValue, expectedValue, "Checking page count match");
assert.assertAll(); // Evaluates and reports any collected mismatches

// Example: Storing and sharing data across scenarios
runtimeDataManager.set('accountId', '12345');
const accountId = runtimeDataManager.get('accountId'); // '12345'

// Example: Playwright UI Assertions with Allure-friendly messages
const uiAssert = new PlaywrightAssertions(() => this.page, this);
await uiAssert.assertElementVisible('#loginBtn', 'Verified Login button is visible');
await uiAssert.assertElementContainsText('h1', 'Dashboard', 'Verified Dashboard header text');
uiAssert.assertTextsMatch('ACTIVE', 'ACTIVE', 'Verified account status value');
```

---

## 📄 PDF Utilities (Generic)

`qe-framework-core` now provides reusable PDF helpers for validating Chrome downloads and PDF content:

```javascript
import {
  getChromeDownloadsPath,
  waitForPdfDownload,
  getPdfTextContent,
  verifyPdfContainsText
} from 'qe-framework-core';

const pdf = await waitForPdfDownload('statement.pdf'); // waits in Chrome Downloads and verifies non-empty file
await verifyPdfContainsText(pdf.absolutePath, 'Account Summary');
```

### Available APIs

- `getChromeDownloadsPath()` → resolves Chrome Downloads path (`%USERPROFILE%\Downloads` by default).
- `waitForPdfDownload(fileName?, timeoutMs?, pollIntervalMs?)` → waits for a matching `.pdf` in Downloads and ensures file size > 0.
- `getPdfTextContent(filePath)` → extracts text content from the PDF.
- `verifyPdfContainsText(filePath, expectedText)` → throws if expected text is not found.

> Optional override: set `CHROME_DOWNLOADS_PATH` when the browser downloads to a custom directory.
