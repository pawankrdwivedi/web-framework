# 🚀 Enterprise-Grade Playwright + Cucumber BDD Test Automation Framework

This repository houses a production-ready, highly scalable, enterprise-grade test automation framework built using **Playwright**, **Cucumber BDD**, and **Node.js**.

It is structured to enforce a strict separation of concerns, featuring a generic core library layer (`qe-framework-core`) and an application-specific test suite layer located under the `src/` directory (containing page objects, feature files, step definitions, and environment-specific configuration files).

---

## 🌟 Framework Core Capabilities

1. **Modular Architecture & Code Split**:
   - `qe-framework-core` (packaged core): Houses generic, reusable modules (logger, API clients, DB wrappers, browser managers, assertions, ETL engines).
   - `src/`: Houses application-specific test assets (YAML configurations, Page Objects, Gherkin features, step definitions).
2. **Angular App Synchronization**: Built-in support for Angular testability checks, detecting `window.getAllAngularTestabilities()` to ensure page stability before interactions, preventing flaky UI tests.
3. **Self-Healing Locator Strategy**: An advanced locator mechanism that automatically falls back to alternative element selectors when the primary selector is broken, emitting details to the framework logger `[SelfHealing]`.
4. **Excel-Driven Test Data**: Dynamic mapping of Cucumber `Scenario Outline` `TestCaseID`s to test data spreadsheets. Values are resolved dynamically based on the current run environment.
5. **Unified Data Reconciliation (ETL)**: High-speed verification engines for files (CSV vs. CSV, CSV vs. DB), handling row counts, detailed cell matches, and mathematical aggregates (SUM, AVG, etc.).
6. **Robust Soft Assertions**: Built-in `SoftAssert` utility allowing multiple assertion checkpoints to run in a single test without halting execution on the first failure.
7. **Environment-Specific YAML Configurations & Centralized Defaults**: Centralized configuration management using a master `.env` file at the project root for common defaults, while environment-specific configurations reside inside `src/config/{env}.yaml`.
8. **Interactive Allure & HTML Reporting**: Built-in support for Allure reports, including screenshot attachments, browser trace logs, and execution video recordings on scenario failures.

---

## 🛠️ Technology Stack

- **Core**: Node.js (ESM), JavaScript, Playwright
- **BDD**: Cucumber.js
- **API**: Axios with AJV (JSON Schema Validation)
- **Database**: `pg` (Postgres), `mysql2` (MySQL), `tedious` (MSSQL), `oracledb` (Oracle)
- **ETL & Data**: `csv-parse`, `xlsx`
- **Config & Logs**: `js-yaml`, `winston`, `dotenv`
- **Reporting**: `allure-playwright`, `allure-cucumberjs`

---

## 📁 Repository Structure

```text
├── src/                        # Main source directory for application test assets
│   ├── config/                 # Environment specific YAML configurations (sit-01, etc.)
│   ├── features/               # Cucumber Gherkin BDD test assets
│   ├── pages/           # Page Object Models extending BasePage
│   ├── step-definitions/        # BDD step definition files
│   ├── support/                # Cucumber environment hooks and World setup
│   ├── test/                   # Playwright Spec hybrid POM tests
│   └── test-data/              # Dynamic Excel spreadsheets & ETL source files
├── docs/                       # Project documentation & guides
├── test_logs/                  # Dynamic execution and self-healing anomaly logs
├── test_results/               # Automated test results (screenshots, traces, videos, and reports)
├── .env                        # Common default execution configurations
├── cucumber.yaml               # Cucumber execution configuration
├── package.json                # Project dependencies and scripts
└── run-tests.js                # Programmatic test runner script
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Java** (Required only for compiling and generating local Allure reports)

### 2. Installation
To install and link the framework core library locally, run `npm install` inside the project root:
```bash
npm install
```
This will automatically configure and link the packaged core library (`"qe-framework-core": "file:qe-framework-core-1.0.10.tgz"`) as a dependency.

Next, download the Playwright browser binaries:
```bash
npx playwright install
```

> [!TIP]
> If you encounter SSL certificate verification issues during browser binaries download, execute:
> ```powershell
> $env:NODE_TLS_REJECT_UNAUTHORIZED='0'
> npx playwright install
> ```

### 3. Configuration Settings
Create or modify configuration settings in the `.env` at the project root or environment-specific YAML files inside `src/config/`:

* **`.env`**: Controls browser engine, headless mode, parallel execution threads, screenshot triggers, video recordings, and trace settings.
  ```env
  # Application Selection
  APP=angular-test-demo
  ENV=sit-01

  # Browser Configuration
  BROWSER=Chrome
  HEADLESS=false
  SLOW_MO=0

  # Execution Settings
  PARALLEL=0
  TIMEOUT=90000
  VIEWPORT_WIDTH=1280
  VIEWPORT_HEIGHT=720
  RETRY=0

  # Screenshot and Video Recording
  # off, on, only-on-failure
  SCREENSHOT=off
  # off, on, retain-on-failure, on-first-retry
  VIDEO=off
  # off, on, retain-on-failure, on-first-retry
  TRACE=off
  # Logging in Files (true/false)
  LOGGER=false
  ```

* **`src/config/{env}.yaml`**: Controls environment-specific service endpoints, base URLs, and database configurations. For example, `src/config/sit-01.yaml`:
  ```yaml
  ui:
    baseUrl: https://angular.io
  api:
    baseUrl: https://angular.io/api
  database:
    host: localhost
    port: 5432
    username: test
    password: [PASSWORD]
    name: automation_qa
    type: postgres  
  ```

### 4. Local Development & Framework Packaging
For local framework development and testing, you can package the core library and reference it directly in the test suite:

1. **Generate the Package**:
   Navigate to the core framework directory and package it:
   ```bash
   cd ../qe-framework-core
   npm install
   npm run pack
   ```
   This compiles, minifies, and packs the framework into a tarball (e.g., `qe-framework-core-1.0.10.tgz`).

2. **Link the Package**:
   Copy the generated tarball to the `angular-test-demo` directory, and install/link it:
   ```bash
   cd ../angular-test-demo
   npm install ./qe-framework-core-1.0.10.tgz
   ```
   This updates the dependency reference in `package.json` to point to the local file:
   ```json
   "dependencies": {
     "qe-framework-core": "file:qe-framework-core-1.0.10.tgz"
   }
   ```
   Now you can import core modules directly:
   ```javascript
   import { excelReader, configManager, ApiClient, dbClient, logger } from 'qe-framework-core';
   ```

---

## Running application-specific tests (apps as subfolders)

The runner `app/run-tests.js` now supports executing tests for application folders placed next to `app`, such as `web_app`.

- From repository root (recommended):

```powershell
# Run the framework runner targeting the `web_app` application
node app/run-tests.js --app web_app
# or use the convenience npm script from repo root
npm run test:web_app
```

- From inside an application directory (legacy behavior):

```powershell
cd web_app
node ../app/run-tests.js
```

Notes:
- When the runner is executed from the repo root with `--app <name>`, it will set the child processes' `cwd` to the target app folder so the app's local `node_modules`, Playwright config, and package.json are honored.
- Place each application as a sibling folder to `app` (e.g., `web_app`, `mobile_app`) and run the runner with `--app <folder>`.

---

## 🔄 Cross-Scenario Runtime Data Manager

The `runtimeDataManager` is a **process-level singleton** that persists key/value data for the full duration of the Cucumber test run. It lets one scenario store values (e.g. a newly created account ID, a generated token, a form submission result) and any subsequent scenario — regardless of feature file — can read those values back.

Because it is a singleton bound to the Node.js process, the store **survives** the Cucumber `World` lifecycle (which is created fresh per scenario). Scenarios execute in the order they appear in feature files / the Cucumber execution plan; data stored in an earlier scenario is always available to later ones.

> [!IMPORTANT]
> Ensure the **producing** scenario runs **before** the **consuming** scenario. Control execution order via Cucumber tags, feature file ordering in `cucumber.yaml`, or a strict scenario sequence within the same feature file.

---

### World Binding

`runtimeDataManager` is pre-bound to `this.runtime` in every Cucumber step definition via `CustomWorld`:

```javascript
// src/support/world.js (already configured — no action required)
this.runtime = runtimeDataManager;
```

No additional imports are required in step definitions.

---

### API Reference

#### Flat Store (global key/value pairs)

| Method | Signature | Description |
|---|---|---|
| `set` | `this.runtime.set(key, value)` | Store any value under `key` |
| `get` | `this.runtime.get(key)` | Retrieve value for `key` (`undefined` if absent) |
| `has` | `this.runtime.has(key)` | Returns `true` if `key` exists |
| `setAll` | `this.runtime.setAll({ key: val, ... })` | Bulk-store multiple key/value pairs |
| `getAll` | `this.runtime.getAll()` | Plain-object snapshot of the entire store |
| `delete` | `this.runtime.delete(key)` | Remove a single key |
| `clear` | `this.runtime.clear()` | Wipe the flat store (optionally pass `true` to also wipe namespaces) |

#### Namespaced Store (group related keys under a logical namespace)

Use namespaces to avoid key collisions when multiple features share the same runtime store.

| Method | Signature | Description |
|---|---|---|
| `setNs` | `this.runtime.setNs(ns, key, value)` | Store a value scoped to namespace `ns` |
| `getNs` | `this.runtime.getNs(ns, key)` | Retrieve a value from namespace `ns` |
| `hasNs` | `this.runtime.hasNs(ns, key)` | Returns `true` if `ns → key` exists |
| `getAllNs` | `this.runtime.getAllNs(ns)` | Plain-object snapshot of one namespace |
| `deleteNs` | `this.runtime.deleteNs(ns, key)` | Remove a single key from a namespace |
| `clearNs` | `this.runtime.clearNs(ns)` | Wipe an entire namespace |

#### Diagnostics

| Method | Description |
|---|---|
| `this.runtime.dump()` | Debug-logs the full state of all stores to the framework logger |

---

### Usage in Step Definitions

#### Scenario 1 — Producing (storing) data

```javascript
// src/step-definitions/registration-steps.js
import { Given, When, Then } from '@cucumber/cucumber';
import { RegistrationPage } from '../pages/registration-page.js';

When('user completes the registration form', async function () {
  this.regPage = new RegistrationPage(this.page);
  const userId = await this.regPage.submitRegistration(this.testData);

  // Store the created userId so downstream scenarios can use it
  this.runtime.set('registeredUserId', userId);
  this.logger.info(`Stored registeredUserId: ${userId}`);
});

When('user completes account creation', async function () {
  const accountId = await this.regPage.createAccount();

  // Namespaced storage — avoids collision with keys from other features
  this.runtime.setNs('registration', 'accountId', accountId);
  this.runtime.setNs('registration', 'createdAt', new Date().toISOString());
});
```

#### Scenario 2 — Consuming (reading) data

```javascript
// src/step-definitions/login-steps.js
import { Given, When, Then } from '@cucumber/cucumber';
import { LoginPage } from '../pages/login-page.js';

Given('user is logged in with the registered account', async function () {
  // Retrieve data produced by the registration scenario
  const userId = this.runtime.get('registeredUserId');
  this.logger.info(`Logging in with registeredUserId: ${userId}`);

  this.loginPage = new LoginPage(this.page);
  await this.loginPage.loginWithUserId(userId);
});

Then('the account dashboard should show the correct account ID', async function () {
  // Retrieve namespaced data produced by the registration scenario
  const accountId = this.runtime.getNs('registration', 'accountId');
  const displayed  = await this.dashboardPage.getAccountId();

  this.softAssert.assertEquals(
    displayed,
    accountId,
    'Dashboard account ID matches the runtime-stored value'
  );
});
```

---

### Usage in Feature Files

Order your feature files / scenarios so producers run before consumers. Use meaningful tags to group related flows:

```gherkin
# features/registration/create-account.feature
@registration @smoke
Scenario: User creates a new account
  Given user is on the registration page
  When  user completes the registration form
  Then  a new account ID is generated and stored at runtime

# features/login/login-with-new-account.feature
@login @smoke
Scenario: User logs in with the newly registered account
  Given user is logged in with the registered account
  When  user navigates to the dashboard
  Then  the account dashboard should show the correct account ID
```

Run both scenarios together in order:

```bash
# By shared tag — Cucumber executes in feature-file order
npm run test:cucumber:tag -- "@smoke"

# Or explicitly target the folder — files processed alphabetically
npm run test:cucumber:folder -- src/features/
```

---

### Storing Multiple Values at Once

```javascript
// Bulk store after a complex API call
const responseBody = await this.api.post('/onboarding', payload);

this.runtime.setAll({
  customerId:   responseBody.customerId,
  customerName: responseBody.fullName,
  authToken:    responseBody.token,
  planId:       responseBody.selectedPlan.id
});
```

Later scenarios retrieve individual keys:

```javascript
const token    = this.runtime.get('authToken');
const planId   = this.runtime.get('planId');
```

---

## 📄 PDF Download & Content Verification (Cucumber Usage)

PDF validation is implemented as reusable core utilities in `qe-framework-core` and exposed through Cucumber steps in `src/step-definitions/pdf-steps.js`.

### Step usage in feature files

```gherkin
Scenario: Validate downloaded statement PDF
  Then pdf file "statement.pdf" should be downloaded in Chrome Downloads path and should not be empty
  And downloaded pdf file should contain text "Account Summary"
```

Or in a single step:

```gherkin
Then pdf file "statement.pdf" should contain text "Account Summary"
```

### Notes

- The download location defaults to Chrome's Downloads path (`%USERPROFILE%\Downloads` on Windows).
- For custom paths, set:
  ```env
  CHROME_DOWNLOADS_PATH=C:\path\to\downloads
  ```

---

### Debugging the Runtime Store

Call `dump()` in any step to print the full store contents to the logger at `debug` level:

```javascript
Then('I debug the runtime store state', function () {
  this.runtime.dump();
});
```

To see the output, set `LOGGER=true` and ensure the log level is `debug` in your `.env` file.

---

## ✍️ Creating & Writing Tests

The framework enforces a structured way to write scalable tests using Page Object Models and Cucumber step definitions.

### 1. Page Objects

Create page object models by extending `BasePage` from the core library. All `BasePage` methods accept a flexible **smart selector string** that is automatically resolved to the correct Playwright locator — no need to call `page.locator()`, `page.getByRole()`, etc. manually.

#### Smart Selector Syntax

| Selector String | Playwright equivalent |
|---|---|
| `role=button` | `page.getByRole('button')` |
| `role=button:Submit` | `page.getByRole('button', { name: 'Submit' })` |
| `role=button:Submit:exact` | `page.getByRole('button', { name: 'Submit', exact: true })` |
| `text=Sign in` | `page.getByText('Sign in')` |
| `text~=Sign in` | `page.getByText('Sign in', { exact: true })` |
| `label=Email address` | `page.getByLabel('Email address')` |
| `label~=Email address` | `page.getByLabel('Email address', { exact: true })` |
| `placeholder=Enter email` | `page.getByPlaceholder('Enter email')` |
| `testid=submit-btn` | `page.getByTestId('submit-btn')` |
| `title=Close dialog` | `page.getByTitle('Close dialog')` |
| `alt=Profile picture` | `page.getByAltText('Profile picture')` |
| `xpath=//button[@id='x']` | `page.locator('xpath=//button[@id=\'x\']')` |
| `#my-id`, `.my-class`, `div > p` | `page.locator(selector)` (CSS, with self-healing) |

> [!TIP]
> Semantic selectors (`role=`, `text=`, `label=`, etc.) are inherently resilient and skip the self-healing overhead. CSS/XPath selectors automatically activate the self-healing fallback chain when `fallbacks` are provided.

---

#### Full Page Object Example

```javascript
import { BasePage, logger, configManager } from 'qe-framework-core';

export class RegistrationPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = configManager.getUiConfig().baseUrl + '/register';

    // ── Selectors ────────────────────────────────────────────────────────
    // Semantic selectors — no fallbacks needed
    this.firstNameInput  = 'label=First Name';
    this.lastNameInput   = 'label=Last Name';
    this.emailInput      = 'placeholder=Enter your email';
    this.passwordInput   = 'label~=Password';           // exact match
    this.roleDropdown    = 'role=combobox:Account Type';
    this.termsCheckbox   = 'role=checkbox:I agree to the terms';
    this.submitButton    = 'role=button:Create Account:exact';
    this.successBanner   = 'text=Account created successfully';
    this.errorAlert      = 'role=alert';

    // CSS selector with self-healing fallbacks
    this.avatarUpload    = 'input[data-testid="avatar-upload"]';
    this.avatarFallbacks = ['input[type="file"]', '#avatar-input'];
  }

  async open() {
    await this.navigateTo(this.url);
    await this.waitForNetworkIdle();
  }

  async fillRegistrationForm({ firstName, lastName, email, password, role }) {
    await this.fill(this.firstNameInput, firstName);
    await this.fill(this.lastNameInput, lastName);
    await this.fill(this.emailInput, email);

    // Type character-by-character for password fields with real keydown events
    await this.type(this.passwordInput, password, 80);

    await this.selectOption(this.roleDropdown, { label: role });
    await this.check(this.termsCheckbox);
  }

  async uploadAvatar(filePath) {
    // CSS selector → self-healing fallback chain is activated
    await this.uploadFile(this.avatarUpload, filePath, this.avatarFallbacks);
  }

  async submit() {
    await this.click(this.submitButton);
  }

  async getSuccessMessage() {
    await this.waitForVisible(this.successBanner);
    return this.getText(this.successBanner);
  }

  async getErrorMessage() {
    await this.waitForVisible(this.errorAlert);
    return this.getText(this.errorAlert);
  }

  async isSubmitEnabled() {
    return this.isEnabled(this.submitButton);
  }
}
```

---

#### All BasePage Methods at a Glance

**Navigation**
```javascript
await this.navigateTo('https://example.com/login');
await this.reload();
await this.goBack();
await this.goForward();
await this.waitForURL(/dashboard/);
await this.waitForNetworkIdle();
```

**Click Interactions**
```javascript
await this.click('role=button:Submit');
await this.doubleClick('role=cell:Edit');
await this.rightClick('#context-menu-target');
await this.clickAt('role=canvas', { x: 120, y: 80 });
await this.clickAndHold('.draggable-handle', 600);   // hold for 600ms
```

**Keyboard & Text Input**
```javascript
await this.fill('label=Search', 'Playwright');       // clear then fill
await this.type('label=OTP', '123456', 120);         // char-by-char, 120ms delay
await this.clear('label=Search');
await this.pressKey('label=Search', 'Enter');
await this.pressKeyboard('Escape');                  // global key — no element needed
await this.focus('label=Email');
await this.blur('label=Email');
```

**Form Controls**
```javascript
await this.selectOption('role=combobox:Country', { label: 'India' });
await this.selectOption('role=combobox:Roles',   ['Admin', 'Editor']);   // multi-select
await this.check('role=checkbox:Remember me');
await this.uncheck('role=checkbox:Remember me');
await this.uploadFile('label=Profile Photo', '/tmp/avatar.png');
```

**Mouse / Gestures**
```javascript
await this.hover('role=menuitem:Settings');
await this.dragAndDrop('#draggable', '#drop-zone');
await this.scrollTo(0, 800);                         // absolute pixel position
await this.scrollIntoView('text=Load more');
```

**Dialog Handling**
```javascript
// Register BEFORE the action that triggers the dialog
await this.acceptDialog();
await this.click('role=button:Delete');              // triggers alert → accepted

await this.dismissDialog();
await this.click('role=button:Leave page');          // triggers confirm → dismissed

await this.acceptDialog('My prompt answer');
await this.click('role=button:Rename');              // triggers prompt → answered
```

**Wait Conditions**
```javascript
await this.waitForVisible('text=Loading complete');
await this.waitForHidden('role=progressbar');
await this.waitForAttached('testid=data-table');
await this.waitForText('role=status', 'Saved');
await this.waitFor(500);                             // fixed delay (use sparingly)
```

**State Queries**
```javascript
const title   = await this.getPageTitle();
const url     = this.getPageUrl();

const label   = await this.getText('role=heading');
const labels  = await this.getAllText('role=option');  // all matched elements
const html    = await this.getHtml('.preview-area');
const value   = await this.getInputValue('label=Email');
const href    = await this.getAttribute('role=link:Docs', 'href');

const count   = await this.getCount('role=row');
const visible = await this.isElementVisible('text=Error');
const enabled = await this.isEnabled('role=button:Submit');
const checked = await this.isChecked('role=checkbox:Agree');
const hasTxt  = await this.hasText('role=alert', 'required');
```

**Screenshots & Scripts**
```javascript
await this.screenshot('/tmp/full-page.png');
await this.elementScreenshot('role=dialog', '/tmp/modal.png');
const count = await this.executeScript(() => document.querySelectorAll('li').length);
```

**Frames (iframes)**
```javascript
// By frame name or URL
const frame = this.getFrame('payment-iframe');
await frame.locator('label=Card number').fill('4111 1111 1111 1111');

// Scoped frame locator — resolveLocator syntax works inside frames too
const frameLocator = this.getFrameLocator('#payment-iframe');
await frameLocator.getByLabel('Card number').fill('4111 1111 1111 1111');
```

---

### 2. Cucumber Step Definitions
Write steps using unified assertions, logs, and context clients accessed directly via the Cucumber `World` context (`this`):

```javascript
import { Given, When, Then } from '@cucumber/cucumber';
import { RegistrationPage } from '../pages/registration-page.js';

Given('user is on the registration page', async function () {
  this.regPage = new RegistrationPage(this.page);
  await this.regPage.open();
});

When('user fills in the registration form', async function () {
  await this.regPage.fillRegistrationForm({
    firstName: this.testData.firstName,
    lastName:  this.testData.lastName,
    email:     this.testData.email,
    password:  this.testData.password,
    role:      this.testData.role,
  });
});

When('user submits the registration form', async function () {
  // Verify the button is enabled before clicking
  const canSubmit = await this.regPage.isSubmitEnabled();
  this.softAssert.assertTrue(canSubmit, 'Submit button should be enabled before submit');
  await this.regPage.submit();
});

Then('a success message should be displayed', async function () {
  const message = await this.regPage.getSuccessMessage();
  this.softAssert.assertEquals(message, 'Account created successfully', 'Verify success banner text');
});

Then('the page title should be {string}', async function (expectedTitle) {
  const actual = await this.regPage.getPageTitle();
  this.softAssert.assertEquals(actual, expectedTitle, 'Verify page title');
});

Then('registration header should be visible', async function () {
  await this.playwrightAssert.assertElementVisible(
    'role=heading:Registration',
    'Verified Registration header is visible'
  );
});

Then('welcome text should match {string}', async function (expectedText) {
  await this.playwrightAssert.assertElementContainsText(
    'role=alert',
    expectedText,
    'Verified welcome alert text contains expected value'
  );
});
```

---

## 🏃 Test Execution Commands

Run your tests using the custom programmatic runner `run-tests.js` inside the root directory.

### 1. Cucumber BDD Tests
The runner compiles dynamic Excel test data, configures execution environments, and runs Cucumber CLI.

#### **Run all Cucumber BDD tests**
```bash
npm run test:cucumber
```

#### **Run Cucumber BDD tests by Tag**
Runs BDD scenarios matching a specific tag filter:
```bash
npm run test:cucumber:tag -- "@ui"
```

#### **Run Cucumber BDD tests by Feature File**
Runs scenarios targeting a specific feature file:
```bash
npm run test:cucumber:feature -- src/features/ui/demo-ui.feature
```

#### **Run Cucumber BDD tests by Folder**
Runs all Cucumber feature files under a specific directory:
```bash
npm run test:cucumber:folder -- src/features/ui/
```

#### **Specify Environment Overrides**
Specify target environments (e.g. `sit-01`) with any command:
```bash
npm run test:cucumber -- --env=sit-01
```

> [!IMPORTANT]
> **Windows Command Prompt vs PowerShell Quoting Rules:**
> In Windows PowerShell, the `@` symbol is a special character used for splatting. You **must wrap tags in quotes** (e.g. `"@ui"` or `'@ui'`), otherwise PowerShell will throw a `VariableIsUndefined` error.
> - **Windows PowerShell (Quoted):** 
>   ```powershell
>   npm run test:cucumber:tag -- "@ui"
>   ```
> - **Windows Command Prompt (CMD) / Bash (Direct):** 
>   ```cmd
>   npm run test:cucumber:tag -- @ui
>   ```

---

### 2. Playwright Hybrid POM Tests
The framework supports native Playwright tests (located in `src/test/`) using the same page objects, data parsers, and services.

#### **Run all Playwright POM tests**
```bash
npm run test:playwright
```

#### **Run Playwright POM tests by Tag / Grep**
Runs POM tests matching a specific grep search filter:
```bash
npm run test:playwright:tag -- "Execute hybrid"
```

#### **Run Playwright POM tests by Spec File**
Runs POM tests targeting a specific spec file:
```bash
npm run test:playwright:spec -- src/test/hybrid-demo.spec.js
```

#### **Run Playwright POM tests by Folder**
Runs all POM tests under a specific directory:
```bash
npm run test:playwright:folder -- src/test/
```

#### **Interactive Playwright UI Runner**
Runs Playwright tests using the interactive UI panel:
```bash
npm run test:playwright:ui
```

#### **Specify Environment Overrides (Windows vs Bash)**
Specify target environments using the `TEST_ENV` environment variable:
- **Windows PowerShell:**
  ```powershell
  $env:TEST_ENV="sit-01"; npm run test:playwright
  ```
- **Windows Command Prompt (CMD):**
  ```cmd
  set TEST_ENV=sit-01 && npm run test:playwright
  ```
- **Bash / GitLab CI/CD:**
  ```bash
  TEST_ENV=sit-01 npm run test:playwright
  ```

---

## 📊 Viewing Test Reports

After executing tests, you can inspect execution results using various options:

* **Playwright HTML Report**: Open `test_results/reports/playwright-html/index.html` directly in any web browser.
* **Cucumber HTML Report**: Open `test_results/reports/cucumber-report.html` directly in any web browser.
* **Allure Report**:
  ```bash
  # Automatically compiles and displays Allure trend reports
  npm run allure
  ```
* **Playwright Traces**: Go to `https://trace.playwright.dev/` and upload any trace `.zip` file from `test_results/reports/traces/` to visually step through the execution.

---

## 📡 API Record & Playback Mode (Mountebank)

API recording/playback uses Mountebank only.

### Playback

```env
MOCK_MOUNTEBANK=true
MOCK_MOUNTEBANK_RECORD=false
MOCK_MOUNTEBANK_PLAYBACK=true
```

### Record

```env
MOCK_MOUNTEBANK=true
MOCK_MOUNTEBANK_RECORD=true
MOCK_MOUNTEBANK_PLAYBACK=false
MOCK_MOUNTEBANK_TARGET_URL=http://real-backend-host:8080
```

Optional overrides:

```env
MOCK_MOUNTEBANK_ADMIN_HOST=127.0.0.1
MOCK_MOUNTEBANK_ADMIN_PORT=2525
MOCK_MOUNTEBANK_IMPOSTER_PORT=4545
```

### 3. Mountebank/Montebank Server Demo (from `qe-framework-core`)

This project includes a sample showing how to use the Mountebank server manager exposed by `qe-framework-core` through `src/support/montebank-server.js`.

- Feature: `src/features/api/montebank-server-demo.feature`
- Steps: `src/step-definitions/montebank-server-steps.js`
- Sample imposter: `test_data_mock_data/mountebank-imposter-montebank_server_demo.json`

Run only playback demo:

```bash
npm run test:cucumber -- --tags "@montebank-playback"
```

The demo starts a local Mountebank server, loads the sample imposter in playback mode, performs a request against the imposter endpoint, validates the response, and then automatically cleans up in hooks.

Run record demo:

```bash
npm run test:cucumber -- --tags "@montebank-record-demo"
```

This runs proxy recording against `https://postman-echo.com`, then saves replayable stubs to:

`test_data_mock_data/mountebank-imposter-montebank_server_record_demo.json`

---

## 🚀 GitLab CI/CD Pipeline Integration

Below is a production-ready `.gitlab-ci.yml` pipeline configuration to run the test suite, isolate logs, and compile Allure trend reports:

```yaml
stages:
  - install
  - test
  - report

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

run_bdd_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.44.1-jammy
  script:
    - npm run test:cucumber
  artifacts:
    when: always
    paths:
      - test_results/
      - test_logs/
    expire_in: 7 days

run_pom_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.44.1-jammy
  script:
    - npm run test:playwright
  artifacts:
    when: always
    paths:
      - test_results/
      - test_logs/
    expire_in: 7 days

generate_allure_report:
  stage: report
  image: node:18-jammy
  before_script:
    - apt-get update && apt-get install -y default-jdk
    - npm install -g allure-commandline
  script:
    - npm run allure:generate
  artifacts:
    when: always
    paths:
      - test_results/reports/allure-report/
    expire_in: 30 days
```
