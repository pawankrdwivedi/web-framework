# 🏗️ QE Framework Core (`qe-framework-core`)

This is the reusable, application-agnostic **core automation engine** for enterprise test automation. It houses all low-level operational layers, including Playwright browser management, API wrappers, database drivers, network mocking, soft assertions, and high-speed ETL reconciliation engines.

To protect core framework assets and simplify client installations, this package is compiled, bundled, and distributed as a tarball dependency (`qe-framework-core-{version}.tgz`) for consumer test suites.

---

## 📦 Technology Stack

- **Core Runtime**: Node.js (ESM), JavaScript
- **Browser Automation**: Playwright v1.40+
- **HTTP Client**: Axios with AJV (JSON Schema Validation)
- **Databases**: PostgreSQL (`pg`), MySQL (`mysql2`), MSSQL (`tedious`), Oracle (`oracledb`)
- **Data Processing**: `csv-parse`, `xlsx` (Excel)
- **Configuration**: `js-yaml`, `winston` (logging), `dotenv` (env variables)
- **Mocking**: Mountebank for API service virtualization
- **PDF Processing**: `pdfjs-dist`

---

## 🛠️ Architecture & Modules

### 1. **Browser Management** (`browser/`)
- **BrowserManager**: Provisions browser contexts, captures execution artifacts (screenshots, traces, network logs, console messages)
- **BasePage**: Base class for all Page Object Models with smart selector resolution
- **AngularHelper**: Integrates with Angular's Zone.js for automatic async stabilization via `window.getAllAngularTestabilities()`

**Key Features:**
- Self-healing locator fallbacks for resilient element selection
- Built-in logging for all interactions
- Screenshot and trace capture on demand or failure
- Frame and iframe support

### 2. **API Client** (`api/`)
Axios-based HTTP wrapper with:
- Custom request/response logging
- Built-in **AJV JSON Schema** validation for response contracts
- Unified error handling and timeout management
- Request interceptors for authentication headers

### 3. **Assertions** (`assertions/`)
- **SoftAssert**: Collect multiple assertion failures and report them all at once without halting execution
- **PlaywrightAssertions**: Specialized assertions for UI element visibility, text matching, and state verification

### 4. **Configuration Management** (`config/`)
- Loads `.env` file with defaults
- Parses environment-specific YAML (`config/{env}.yaml`)
- Priority-based resolution: System env vars > YAML > .env defaults
- Provides typed access to execution, database, UI, and API configurations

### 5. **Data Layer** (`data/`)
- **ExcelReader**: Reads Excel workbooks, matches `TestCaseID` to scenario data
- **RuntimeDataManager**: Process-level singleton for cross-scenario data sharing (flat and namespaced stores)
- **TestAssetGenerator**: Auto-generates Excel test data structures from metadata

### 6. **Database Client** (`db/`)
Standard SQL connection pool interface supporting:
- PostgreSQL, MySQL, MSSQL, Oracle
- Dynamic mock fallback mode for offline scenarios
- Connection pooling and automatic cleanup

### 7. **ETL Validation Engine** (`etl/`)
High-speed file and database reconciliation:
- Row count verification (CSV vs CSV, CSV vs DB)
- Cell-by-cell row matching with primary key mapping
- Mathematical column aggregates (SUM, AVG, MIN, MAX)
- Detailed mismatch reporting

### 8. **Network Mocking** (`mock/`)
- **NetworkRecordPlaybackManager**: Records/replays API responses using Playwright routing
  - Record mode: Captures real API responses to JSON files
  - Playback mode: Serves recorded mocks without hitting real backend
  - Configurable interception patterns and skip endpoints
- **Mountebank Integration**: Full service virtualization with imposter lifecycle management

### 9. **Logging** (`logger/`)
Winston-based structured logging with:
- File and console transports
- Configurable log levels
- Scenario-level log isolation

### 10. **Reporting** (`reporting/`)
- HTML report generation with test results, screenshots, and artifacts
- Allure reporter integration (if enabled)

### 11. **Utilities** (`utils/`)
- **PathResolver**: Resolves paths relative to application root
- **PDFUtils**: PDF extraction and content verification
- **StringUtils**: Common string transformations

---

## 📁 Project Structure

```
qe-framework-core/
├── api/                          # HTTP client wrapper
│   └── api-client.js
├── assertions/                   # Soft assertions & UI assertions
│   ├── custom-assertions.js
│   └── playwright-assertions.js
├── browser/                      # Browser & page management
│   ├── angular-helper.js
│   ├── base-page.js
│   └── browser-manager.js
├── config/                       # Configuration engine
│   └── config-manager.js
├── data/                         # Data readers & runtime store
│   ├── excel-reader.js
│   └── runtime-data-manager.js
├── db/                           # Database client
│   └── db-client.js
├── etl/                          # ETL validation engine
│   └── etl-validator.js
├── logger/                       # Logging utilities
│   └── logger.js
├── mock/                         # Network mocking
│   └── network-record-playback-manager.js
├── reporting/                    # Reporting & artifacts
│   ├── allure-reporter.js
│   └── generate-cucumber-html.js
├── utils/                        # Utility functions
│   ├── path-resolver.js
│   ├── pdf-utils.js
│   └── string-utils.js
├── index.js                      # Main export file
├── package.json                  # Core dependencies
└── README.md                     # This file
```

---

## 🚀 Building & Packaging the Core

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Navigate to the core directory**:
   ```bash
   cd qe-framework-core
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Building the Package

#### 1. Build (Transpile & Minify)
Compile the core library (typically using esbuild or similar):
```bash
npm run build
```

This outputs optimized JavaScript to the `dist/` directory.

#### 2. Pack the Bundle
Create a distributable tarball:
```bash
npm run pack
```

This generates `qe-framework-core-{version}.tgz` in the package root.

**Output**: `qe-framework-core-1.0.44.tgz`

---

## 📥 Linking & Usage in Consumer Applications

Once packaged, the tarball can be linked in consumer test suites (like the `app/` folder):

### Installation in Consumer App

```bash
cd ../app
npm install ../qe-framework-core/qe-framework-core-1.0.44.tgz
```

This adds the dependency to `package.json`:
```json
{
  "dependencies": {
    "qe-framework-core": "file:qe-framework-core-1.0.44.tgz"
  }
}
```

### Import & Usage

```javascript
// Page Objects
import { BasePage } from 'qe-framework-core';

// Assertions
import { SoftAssert, PlaywrightAssertions } from 'qe-framework-core';

// Configuration
import { configManager } from 'qe-framework-core';

// Utilities
import { logger, apiClient, dbClient, runtimeDataManager, excelReader } from 'qe-framework-core';
```

#### Example: Using Core Components

```javascript
// Configure a page object
class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = 'label=Email';
    this.passwordInput = 'label=Password';
    this.submitButton = 'role=button:Sign In';
  }

  async login(email, password) {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }
}

// Use soft assertions
const assert = new SoftAssert();
assert.assertEquals(actualValue, expectedValue, 'Value matches');
assert.assertTrue(condition, 'Condition is true');
assert.assertAll(); // Report all failures

// Access configuration
const uiUrl = configManager.getUiConfig().baseUrl;
const dbConfig = configManager.getDatabaseConfig();

// Use runtime data manager
runtimeDataManager.set('userId', '12345');
const userId = runtimeDataManager.get('userId');

// Make API calls
const response = await apiClient.post('/api/login', { email, password });
```

---

## 🔧 Configuration for Core Development

Create a `.env` file in the core root for development settings:

```env
# Logging
LOGGER=true

# Database (optional for local development)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=automation_qa

# Mock & Recording
MOCK_RECORD=false
MOCK_PLAYBACK=false
```

---

## 📚 API Reference

### BasePage Methods

**Navigation**
```javascript
await page.navigateTo('https://example.com');
await page.reload();
await page.goBack();
await page.waitForNetworkIdle();
```

**Interaction**
```javascript
await page.click('role=button:Submit');
await page.fill('label=Email', 'test@example.com');
await page.type('label=Password', 'secure123', 100); // char-by-char with delay
await page.selectOption('role=combobox', { label: 'Option 1' });
await page.check('role=checkbox:Agree');
await page.hover('role=menuitem:Settings');
await page.dragAndDrop('#draggable', '#dropzone');
```

**Queries**
```javascript
const text = await page.getText('role=heading');
const value = await page.getInputValue('label=Email');
const count = await page.getCount('role=row');
const visible = await page.isElementVisible('text=Error');
```

**Wait Conditions**
```javascript
await page.waitForVisible('text=Loading complete');
await page.waitForHidden('role=progressbar');
await page.waitForText('role=status', 'Saved');
```

### SoftAssert Methods

```javascript
assert.assertEquals(actual, expected, message);
assert.assertTrue(condition, message);
assert.assertFalse(condition, message);
assert.assertNull(value, message);
assert.assertNotNull(value, message);
assert.assertContains(text, substring, message);
assert.assertAll(); // Throws if any failures collected
```

### RuntimeDataManager Methods

```javascript
// Flat store
runtimeDataManager.set(key, value);
runtimeDataManager.get(key);
runtimeDataManager.has(key);
runtimeDataManager.delete(key);
runtimeDataManager.setAll({ key1: val1, key2: val2 });
runtimeDataManager.getAll();

// Namespaced store
runtimeDataManager.setNs('namespace', key, value);
runtimeDataManager.getNs('namespace', key);
runtimeDataManager.hasNs('namespace', key);
runtimeDataManager.getAllNs('namespace');
runtimeDataManager.deleteNs('namespace', key);
runtimeDataManager.clearNs('namespace');

// Diagnostics
runtimeDataManager.dump(); // Logs full state to logger
```

### NetworkRecordPlaybackManager

**Environment Variables:**
```env
MOCK_RECORD=true              # Record mode
MOCK_PLAYBACK=true            # Playback mode
MOCK_INTERCEPT_PATTERN=**/api/** # URL pattern to intercept
MOCK_SKIP_ENDPOINTS=/assets/  # Skip recording these endpoints
MOCK_RECORD_ENDPOINTS=        # Only record specific endpoints (optional)
```

**Usage:**
```javascript
import { networkRecordPlaybackManager } from 'qe-framework-core';

// Initialize (typically in hooks)
await networkRecordPlaybackManager.init(page, scenarioName);

// Save recordings
await networkRecordPlaybackManager.saveRecordedMocks();

// Cleanup
await networkRecordPlaybackManager.stop();
```

### PDF Utilities

```javascript
import {
  getChromeDownloadsPath,
  waitForPdfDownload,
  getPdfTextContent,
  verifyPdfContainsText
} from 'qe-framework-core';

// Wait for PDF download
const pdf = await waitForPdfDownload('invoice.pdf', 30000, 500);
console.log(pdf.absolutePath);

// Extract and verify content
const text = await getPdfTextContent(pdf.absolutePath);
await verifyPdfContainsText(pdf.absolutePath, 'Invoice #12345');
```

---

## 📝 Updating & Versioning

### When to Rebuild & Re-package

Rebuild the core whenever you:
1. Add new modules or utilities
2. Fix bugs in core functionality
3. Update dependencies
4. Change the public API (imports/exports)

### Steps to Update

1. Make changes to source files
2. Update version in `package.json`:
   ```json
   {
     "version": "1.0.45"
   }
   ```
3. Rebuild and pack:
   ```bash
   npm run build
   npm run pack
   ```
4. Copy the new tarball to consumer applications:
   ```bash
   cp qe-framework-core-1.0.45.tgz ../app/
   ```
5. Update consumer `package.json` with new version:
   ```bash
   cd ../app
   npm install ./qe-framework-core-1.0.45.tgz
   ```

---

## 🔗 Dependencies

All dependencies are listed in `package.json` and locked via `package-lock.json` for reproducible builds.

**Key Production Dependencies:**
- `playwright` — Browser automation
- `axios` — HTTP client
- `ajv` — JSON Schema validation
- `pg`, `mysql2`, `tedious`, `oracledb` — Database drivers
- `xlsx` — Excel parsing
- `csv-parse` — CSV parsing
- `js-yaml` — YAML parsing
- `winston` — Logging
- `dotenv` — Environment variable loading
- `pdfjs-dist` — PDF content extraction

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: Package import fails after updating
```
Error: Cannot find module 'qe-framework-core'
```
**Solution**: Rebuild and reinstall:
```bash
cd qe-framework-core
npm run build
npm run pack
cd ../app
npm install ../qe-framework-core/qe-framework-core-{version}.tgz
```

**Issue**: Old tarball cached
**Solution**: Clear npm cache:
```bash
npm cache clean --force
npm install
```

---

## 📖 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Axios Documentation](https://axios-http.com/)
- [AJV JSON Schema Validator](https://ajv.js.org/)
- [Winston Logger](https://github.com/winstonjs/winston)

---

## 📄 License

Internal use only. All rights reserved.
