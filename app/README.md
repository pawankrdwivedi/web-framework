# 🚀 Enterprise-Grade Playwright-BDD Test Automation Framework

This is a production-ready, application-specific test suite built on the **qe-framework-core** library using **Playwright**, **Playwright-BDD**, and **Node.js**.

It demonstrates a **strict separation of concerns**: generic, reusable components live in `qe-framework-core` (logger, API clients, DB wrappers, browser managers, assertions, ETL engines), while application-specific assets live here (page objects, feature files, step definitions, YAML configurations).

---

## 🌟 Key Features

1. **Modular Page Objects**: Leverage `BasePage` from qe-framework-core with smart selector resolution and self-healing locators
2. **Angular App Synchronization**: Automatic async stabilization via `window.getAllAngularTestabilities()`
3. **Self-Healing Selectors**: Fallback to alternative element selectors when primary selectors break
4. **Excel-Driven Test Data**: Dynamic mapping of scenario test case IDs to spreadsheet values per environment
5. **Cross-Scenario Data Sharing**: Singleton runtime store enabling one scenario to produce and another to consume data
6. **Soft Assertions**: Multiple assertion checkpoints run to completion, failures collected and reported together
7. **API Record/Playback**: Capture live API responses in record mode, replay mocks in playback mode for deterministic tests
8. **High-Speed ETL**: CSV/DB data reconciliation with row counts, cell matches, and mathematical aggregates
9. **Centralized Configuration**: `.env` for common defaults + environment-specific YAML overrides

---

## 📁 Project Structure

```
app/
├── docs/                             # Non-markdown documentation (Word, Excel, etc.)
├── src/                              # Application-specific test assets
│   ├── config/                       # Environment-specific YAML configurations
│   │   ├── demo-app.yaml            # UI and API endpoints for demo-app
│   │   └── ...
│   ├── features/                     # BDD feature files (Gherkin)
│   │   ├── ui/
│   │   │   ├── demo-app.feature
│   │   │   ├── google-search.feature
│   │   │   └── ...
│   │   └── api/
│   │       └── ...
│   ├── pages/                        # Page Object Models
│   │   ├── base-page.js             # Re-exports from qe-framework-core
│   │   ├── demo-app-page.js
│   │   ├── google-search-page.js
│   │   ├── page-manager.js          # Aggregator for all pages
│   │   └── ...
│   ├── step-definitions/             # BDD step definitions
│   │   ├── demo-app-ui-steps.js
│   │   ├── google-ui-steps.js
│   │   └── ...
│   ├── support/                      # Playwright-BDD setup & hooks
│   │   ├── world.js                 # Fixtures & context
│   │   ├── hooks.js                 # Before/After lifecycle
│   │   └── run-tests.js             # Custom test runner
│   ├── test/                         # Playwright Spec (hybrid POM) tests
│   │   └── hybrid-demo-app.spec.js
│   └── test-data/                    # Excel sheets, CSV files
│       └── source-etl.csv
├── test-logs/                        # Execution logs
├── test-results/                     # Screenshots, traces, videos, reports
├── test-mock/                        # Recorded API responses (auto-generated)
│   ├── api_login.json
│   ├── api_dashboard_stats.json
│   └── ...
├── .env                              # Common execution defaults
├── playwright.config.js              # Playwright configuration
├── package.json                      # Dependencies & npm scripts
└── README.md                         # This file
```

---

## 🛠️ Technology Stack

- **Core**: Node.js (ESM), JavaScript, Playwright v1.40+
- **BDD**: Playwright-BDD v9.2.0
- **API**: Axios + AJV (JSON Schema validation)
- **Database**: PostgreSQL, MySQL, MSSQL, Oracle
- **Data**: Excel (`xlsx`), CSV (`csv-parse`)
- **Config**: `js-yaml`, `dotenv`, `winston`
- **Mocking**: Playwright routing + Mountebank

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Playwright browsers**: Downloaded via `npx playwright install`

### 2. Installation

```bash
# Navigate to the app directory
cd app

# Install dependencies (automatically links qe-framework-core tarball)
npm install

# Download Playwright browser binaries
npx playwright install

# Optional: If SSL issues occur on Windows
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
npx playwright install
```

### 3. Configuration

Edit or create `.env` in the app root:

```env
# Application & Environment
APP=app
ENV=demo-app

# Browser
BROWSER=Chrome
HEADLESS=false
SLOW_MO=0

# Execution
PARALLEL=0               # 0=sequential, N=parallel workers
TIMEOUT=90000            # milliseconds
RETRY=0

# Logging
LOGGER=true

# API Mocking
MOCK_RECORD=false        # true to record API responses
MOCK_PLAYBACK=false      # true to replay recorded mocks
MOCK_INTERCEPT_PATTERN=**/api/**
MOCK_SKIP_ENDPOINTS=/assets/,/images/,/fonts/

# Reporting
SCREENSHOT=only-on-failure  # off, on, only-on-failure
VIDEO=retain-on-failure     # off, on, retain-on-failure, on-first-retry
TRACE=retain-on-failure     # off, on, retain-on-failure, on-first-retry
```

Create environment-specific config: `src/config/{env}.yaml`

```yaml
ui:
  baseUrl: http://localhost:5173/

api:
  baseUrl: http://localhost:3001

database:
  host: localhost
  port: 5432
  username: postgres
  password: yourpassword
  name: automation_qa
  type: postgres
```

---

## ✍️ Writing Tests

### 1. Create Page Objects

Extend `BasePage` from `qe-framework-core` with smart selector syntax:

```javascript
// src/pages/login-page.js
import { BasePage } from 'qe-framework-core';
import { configManager } from 'qe-framework-core';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = configManager.getUiConfig().baseUrl + '/login';
    
    // Smart selectors: role=, text=, label=, placeholder=, xpath=, etc.
    this.emailInput = 'label=Email';
    this.passwordInput = 'label=Password';
    this.submitButton = 'role=button:Sign In';
    this.errorAlert = 'role=alert';
  }

  async open() {
    await this.navigateTo(this.url);
    await this.waitForNetworkIdle();
  }

  async login(email, password) {
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  async getErrorMessage() {
    await this.waitForVisible(this.errorAlert);
    return this.getText(this.errorAlert);
  }
}
```

**Smart Selector Types:**
```
role=button:Submit              → page.getByRole('button', { name: 'Submit' })
text=Welcome                    → page.getByText('Welcome')
text~=Welcome                   → page.getByText('Welcome', { exact: true })
label=Email Address             → page.getByLabel('Email Address')
placeholder=Enter email         → page.getByPlaceholder('Enter email')
testid=login-form              → page.getByTestId('login-form')
xpath=//button[@id='submit']    → page.locator('xpath=//button[@id="submit"]')
#my-id, .my-class, div > p     → page.locator(selector)  [CSS, with self-healing]
```

### 2. Write BDD Step Definitions

Import `Given`, `When`, `Then` from `world.js` and use fixture injection:

```javascript
// src/step-definitions/login-steps.js
import { Given, When, Then } from '../support/world.js';
import { LoginPage } from '../pages/login-page.js';

Given('user is on the login page', async function () {
  this.loginPage = new LoginPage(this.page);
  await this.loginPage.open();
});

When('user logs in with {string} and {string}', async function (email, password) {
  await this.loginPage.login(email, password);
});

Then('user should see an error message', async function () {
  const errorMsg = await this.loginPage.getErrorMessage();
  this.softAssert.assertNotNull(errorMsg, 'Error message displayed');
});

Then('the dashboard should display {string}', async function (expectedText) {
  await this.playwrightAssert.assertElementContainsText(
    'role=heading:Dashboard',
    expectedText,
    'Verified dashboard heading'
  );
});
```

### 3. Create Feature Files

Write BDD scenarios in Gherkin:

```gherkin
# src/features/ui/login.feature
Feature: User Login

  @ui @smoke @demo-app
  Scenario: Successful login with valid credentials
    Given user is on the login page
    When user logs in with "admin@example.com" and "password123"
    Then the dashboard should display "Welcome"

  @ui @demo-app
  Scenario: Failed login with invalid password
    Given user is on the login page
    When user logs in with "admin@example.com" and "wrongpassword"
    Then user should see an error message
```

---

## 🏃 Running Tests

### Basic Execution

```bash
# Run all tests
npm run test

# Run tests matching a tag
npm run test:tag -- "@demo-app"

# Run specific feature file
npm run test:spec -- "src/features/ui/login.feature"

# Interactive UI mode
npm run test:ui

# View HTML report
npm run test:report
```

### Advanced Filtering

```bash
# Single tag
npm run test:tag -- "@demo-app"

# Multiple tags (AND)
npm run test:tag -- "@demo-app" "@smoke"

# Exclude tag (NOT)
npm run test:tag -- "not @wip"

# By test name pattern
npm run test -- --grep "login"
```

> **Windows PowerShell Note**: Wrap `@` tags in quotes:
> ```powershell
> npm run test:tag -- "@demo-app"     # Correct
> npm run test:tag -- @demo-app       # Throws error
> ```

### Environment Overrides

```bash
# Override via command line
npm run test -- --env=qa

# Override via .env file
ENV=qa npm run test

# Or edit .env directly
```

---

## 🎯 Using qe-framework-core Features

### Soft Assertions

Collect multiple failures, report all at once:

```javascript
Given('user verifies account details', async function () {
  const name = await this.accountPage.getName();
  const email = await this.accountPage.getEmail();
  const status = await this.accountPage.getStatus();

  // All assertions run, even if first fails
  this.softAssert.assertEquals(name, 'John Doe', 'Verify name');
  this.softAssert.assertEquals(email, 'john@example.com', 'Verify email');
  this.softAssert.assertEquals(status, 'Active', 'Verify status');

  // Throws if any failed
  this.softAssert.assertAll();
});
```

### Cross-Scenario Data Sharing

Store data in one scenario, use in another:

```javascript
// Scenario 1: Create account (producer)
When('user creates account with {string}', async function (email) {
  const accountId = await this.api.post('/api/accounts', { email });
  this.runtime.set('newAccountId', accountId);
});

// Scenario 2: Login with new account (consumer)
Given('user logs in with the newly created account', async function () {
  const accountId = this.runtime.get('newAccountId');
  await this.loginPage.loginWithAccountId(accountId);
});
```

### API Record/Playback

**Record mode** - Capture live API responses:

```env
MOCK_RECORD=true
MOCK_PLAYBACK=false
```

Run tests to generate `test-mock/*.json` files.

**Playback mode** - Use recorded responses:

```env
MOCK_RECORD=false
MOCK_PLAYBACK=true
```

Tests will use mocked responses instead of hitting the real backend.

### Excel-Driven Test Data

Map scenario test case IDs to Excel rows:

```javascript
Given('test data is loaded for {string}', async function (testCaseId) {
  // Loads data from src/test-data/test-data.xlsx
  this.loadExcelTestData('LoginTests', testCaseId);
  
  // testData is now populated from the Excel sheet
  const email = this.testData.email;
  const password = this.testData.password;
});
```

---

## 📊 Configuration

### .env File

Controls execution defaults across all environments:

```env
# Execution Settings
PARALLEL=0              # Workers: 0=serial, N=parallel
TIMEOUT=90000           # Test timeout (ms)
RETRY=0                 # Retry failed tests
BROWSER=Chrome          # Chrome, Firefox, Safari, Edge
HEADLESS=false          # Headless mode
SLOW_MO=0              # Slow motion (ms per action)

# Viewport
VIEWPORT_WIDTH=1280
VIEWPORT_HEIGHT=720

# Artifacts
SCREENSHOT=only-on-failure
VIDEO=retain-on-failure
TRACE=retain-on-failure

# Logging
LOGGER=true

# API Mocking
MOCK_RECORD=false
MOCK_PLAYBACK=false
MOCK_INTERCEPT_PATTERN=**/api/**
MOCK_SKIP_ENDPOINTS=/assets/,/images/,/fonts/
MOCK_RECORD_ENDPOINTS=
```

### Environment YAML (`src/config/{env}.yaml`)

Override .env defaults per environment:

```yaml
# demo-app.yaml
ui:
  baseUrl: http://localhost:5173/

api:
  baseUrl: http://localhost:3001

database:
  type: postgres
  host: localhost
  port: 5432
  username: postgres
  password: secret
  name: demo_db
```

---

## 📡 API Record & Playback

### Recording Live Responses

Set environment and run tests:

```env
MOCK_RECORD=true
MOCK_PLAYBACK=false
MOCK_INTERCEPT_PATTERN=**/api/**
MOCK_SKIP_ENDPOINTS=/assets/,/images/,/fonts/
```

```bash
npm run test
```

Recorded responses save to `test-mock/`:
```
test-mock/
├── api_login.json
├── api_dashboard_stats.json
└── api_products.json
```

### Replaying Mocks

Switch to playback mode:

```env
MOCK_RECORD=false
MOCK_PLAYBACK=true
```

```bash
npm run test
```

All API calls hit recorded mocks; no backend server needed.

---

## 🔍 Debugging

### Enable Logging

```env
LOGGER=true
```

Logs output to console and `test-logs/` directory.

### Playwright Inspector

Run in UI mode with interactive debugging:

```bash
npm run test:ui
```

### Debug a Specific Test

```bash
npm run test -- --grep "login" --ui
```

### View Traces

```bash
# After test run, view traces
npm run test:report
```

Open trace files from `test-results/reports/traces/` at [trace.playwright.dev](https://trace.playwright.dev/)

---

## 📈 Reporting

### HTML Report

```bash
npm run test:report
```

Opens `test-results/report-{env}/index.html` with:
- Test results (pass/fail)
- Screenshots on failure
- Video recordings
- Execution timeline

### Test Logs

Logs saved to `test-logs/execution-{timestamp}.log` with configurable detail level.

---

## 🔗 Project Dependencies

### Local Dependencies
- `qe-framework-core-1.0.44.tgz` — Core library (file-based)

### NPM Dependencies
- `playwright-bdd` v9.2.0 — BDD test runner
- `dotenv` v16.3.1 — Environment variables
- `js-yaml` v4.1.0 — YAML parsing

All other dependencies pulled from `qe-framework-core` (axios, postgres, mysql, etc.)

---

## 🐛 Troubleshooting

### "No tests found" error

**Cause**: bddgen failed to generate test specs, usually due to missing step definitions

**Solution**:
1. Check step definition file names match pattern: `*-steps.js` in `src/step-definitions/`
2. Ensure all Gherkin steps have corresponding step definitions
3. Check for typos in step text

### Browser won't start

**Cause**: Playwright browsers not installed

**Solution**:
```bash
npx playwright install
```

### Port conflicts

**Cause**: App server already running on configured port

**Solution**:
```bash
# Change port in src/config/{env}.yaml
ui:
  baseUrl: http://localhost:5174/  # Use different port
```

### Tests timeout

**Cause**: TIMEOUT value too low or page waiting indefinitely

**Solution**:
```env
TIMEOUT=120000  # Increase timeout in .env
```

---

## � PDF Download & Content Verification

PDF validation is implemented as reusable core utilities in `qe-framework-core` and exposed through step definitions in `src/step-definitions/pdf-steps.js`.

### Step Usage

Steps are automatically registered from files in `src/step-definitions/` using Playwright-BDD's `Given`, `When`, `Then` exports.

### Feature File Example

```gherkin
Scenario: Validate downloaded statement PDF
  Then pdf file "statement.pdf" should be downloaded in Chrome Downloads path and should not be empty
  And downloaded pdf file should contain text "Account Summary"
```

### Configuration

- The download location defaults to Chrome's Downloads path (`%USERPROFILE%\Downloads` on Windows).
- For custom paths, set:
  ```env
  CHROME_DOWNLOADS_PATH=C:\path\to\downloads
  ```

For detailed API reference on PDF utilities, see the [qe-framework-core README](../qe-framework-core/README.md#pdf-utilities).

---

## 📚 Additional Resources

- [Playwright Docs](https://playwright.dev/)
- [Playwright-BDD Docs](https://github.com/vitalets/playwright-bdd)
- [Gherkin Syntax](https://cucumber.io/docs/gherkin/)
- [qe-framework-core README](../qe-framework-core/README.md)

---

## 🚀 CI/CD Integration

Below is a production-ready `.gitlab-ci.yml` pipeline configuration to run the test suite and isolate logs:

```yaml
stages:
  - install
  - test

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/

install_dependencies:
  stage: install
  image: mcr.microsoft.com/playwright:v1.44.1-jammy
  script:
    - npm ci
    - npx playwright install chromium

run_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.44.1-jammy
  script:
    - npm run test
  artifacts:
    when: always
    paths:
      - test-results/
      - test-logs/
    expire_in: 7 days
```

---

## 📄 License

Internal use only. All rights reserved.
