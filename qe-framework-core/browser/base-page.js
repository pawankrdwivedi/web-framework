import browserManager from './browser-manager.js';
import angularHelper from './angular-helper.js';
import logger from '../logger/Logger.js';
import configManager from '../config/config-manager.js';

/**
 * BasePage — base class for all Page Object Models.
 *
 * ─── Smart Locator Syntax ────────────────────────────────────────────────────
 * Every method that accepts a `selector` string passes it through
 * `resolveLocator()` first.  This means you can use either plain CSS/XPath
 * strings OR any of the following semantic prefixes:
 *
 *   text=Sign in                 → page.getByText('Sign in')
 *   text~=Sign in                → page.getByText('Sign in', { exact: true })
 *   role=button                  → page.getByRole('button')
 *   role=button:Submit           → page.getByRole('button', { name: 'Submit' })
 *   role=button:Submit:exact     → page.getByRole('button', { name: 'Submit', exact: true })
 *   label=Email address          → page.getByLabel('Email address')
 *   label~=Email address         → page.getByLabel('Email address', { exact: true })
 *   placeholder=Enter email      → page.getByPlaceholder('Enter email')
 *   placeholder~=Enter email     → page.getByPlaceholder('Enter email', { exact: true })
 *   testid=submit-btn            → page.getByTestId('submit-btn')
 *   title=Close dialog           → page.getByTitle('Close dialog')
 *   alt=Profile picture          → page.getByAltText('Profile picture')
 *   xpath=//button[@id='x']      → page.locator('xpath=//button[@id=\'x\']')
 *   #my-id, .my-class, div > p   → page.locator(selector)   (CSS, auto-detected)
 *
 * Self-healing fallbacks are honoured for all interactive operations that
 * accept a `fallbacks` array — each fallback string is resolved the same way.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class BasePage {
  constructor(page) {
    this.page = page;
  }

  // ─── Locator Resolution ───────────────────────────────────────────────────

  /**
   * Resolve a selector string into a Playwright Locator using the prefix
   * syntax described in the class-level JSDoc.
   *
   * @param {string} selector
   * @returns {import('playwright').Locator}
   */
  resolveLocator(selector) {
    const s = selector.trim();

    // role=<role>  |  role=<role>:<name>  |  role=<role>:<name>:exact
    const roleMatch = s.match(/^role=([^:]+)(?::([^:]+))?(?::(exact))?$/i);
    if (roleMatch) {
      const [, role, name, exact] = roleMatch;
      const opts = {};
      if (name) opts.name = name;
      if (exact) opts.exact = true;
      logger.info(`[BasePage] [resolveLocator] getByRole("${role.trim()}"${name ? `, name="${name}"` : ''}${exact ? ', exact' : ''})`);
      return this.page.getByRole(role.trim(), Object.keys(opts).length ? opts : undefined);
    }

    // text~=<value>  (exact match)
    if (/^text~=/i.test(s)) {
      const value = s.slice(6);
      logger.info(`[BasePage] [resolveLocator] getByText("${value}", exact)`);
      return this.page.getByText(value, { exact: true });
    }

    // text=<value>  (partial/default match)
    if (/^text=/i.test(s)) {
      const value = s.slice(5);
      logger.info(`[BasePage] [resolveLocator] getByText("${value}")`);
      return this.page.getByText(value);
    }

    // label~=<value>  (exact)
    if (/^label~=/i.test(s)) {
      const value = s.slice(7);
      logger.info(`[BasePage] [resolveLocator] getByLabel("${value}", exact)`);
      return this.page.getByLabel(value, { exact: true });
    }

    // label=<value>
    if (/^label=/i.test(s)) {
      const value = s.slice(6);
      logger.info(`[BasePage] [resolveLocator] getByLabel("${value}")`);
      return this.page.getByLabel(value);
    }

    // placeholder~=<value>  (exact)
    if (/^placeholder~=/i.test(s)) {
      const value = s.slice(13);
      logger.info(`[BasePage] [resolveLocator] getByPlaceholder("${value}", exact)`);
      return this.page.getByPlaceholder(value, { exact: true });
    }

    // placeholder=<value>
    if (/^placeholder=/i.test(s)) {
      const value = s.slice(12);
      logger.info(`[BasePage] [resolveLocator] getByPlaceholder("${value}")`);
      return this.page.getByPlaceholder(value);
    }

    // testid=<value>
    if (/^testid=/i.test(s)) {
      const value = s.slice(7);
      logger.info(`[BasePage] [resolveLocator] getByTestId("${value}")`);
      return this.page.getByTestId(value);
    }

    // title=<value>
    if (/^title=/i.test(s)) {
      const value = s.slice(6);
      logger.info(`[BasePage] [resolveLocator] getByTitle("${value}")`);
      return this.page.getByTitle(value);
    }

    // alt=<value>
    if (/^alt=/i.test(s)) {
      const value = s.slice(4);
      logger.info(`[BasePage] [resolveLocator] getByAltText("${value}")`);
      return this.page.getByAltText(value);
    }

    // xpath=<expression>  — prefix it so Playwright treats it as XPath
    if (/^xpath=/i.test(s)) {
      const expr = s.slice(6).trim().startsWith('xpath=') ? s.slice(6) : `xpath=${s.slice(6)}`;
      logger.info(`[BasePage] [resolveLocator] locator("${expr}")`);
      return this.page.locator(expr);
    }

    // Default → CSS / XPath auto-detected by Playwright
    logger.info(`[BasePage] [resolveLocator] locator("${s}")`);
    return this.page.locator(s);
  }

  /**
   * Resolve a locator with self-healing fallback support.
   * Semantic-prefix selectors skip self-healing (they are already resilient).
   * CSS/XPath selectors use the full self-healing workflow.
   *
   * @param {string} selector
   * @param {string[]} fallbacks
   * @param {number} timeout
   * @returns {Promise<import('playwright').Locator>}
   */
  async resolveWithHealing(selector, fallbacks = [], timeout = 5000) {
    const isSemanticSelector = /^(text[~]?=|role=|label[~]?=|placeholder[~]?=|testid=|title=|alt=)/i.test(selector.trim());

    if (isSemanticSelector) {
      // Semantic locators are stable — wait directly without self-healing overhead
      const locator = this.resolveLocator(selector);
      await locator.waitFor({ state: 'attached', timeout });
      return locator;
    }

    // CSS/XPath path — use full self-healing strategy
    return browserManager.findElementWithSelfHealing(this.page, selector, fallbacks, timeout);
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  async navigateTo(pathOrUrl) {
    logger.info(`[BasePage] Navigating to URL/Path: ${pathOrUrl}`);
    await this.page.goto(pathOrUrl);
    await this.waitForAngular();
  }

  /**
   * Reload the current page.
   * @param {'load'|'domcontentloaded'|'networkidle'|'commit'} [waitUntil='load']
   */
  async reload(waitUntil = 'load') {
    logger.info(`[BasePage] Reloading page (waitUntil: ${waitUntil})`);
    await this.page.reload({ waitUntil });
    await this.waitForAngular();
  }

  /**
   * Navigate back in browser history.
   * @param {'load'|'domcontentloaded'|'networkidle'|'commit'} [waitUntil='load']
   */
  async goBack(waitUntil = 'load') {
    logger.info('[BasePage] Navigating back');
    await this.page.goBack({ waitUntil });
    await this.waitForAngular();
  }

  /**
   * Navigate forward in browser history.
   * @param {'load'|'domcontentloaded'|'networkidle'|'commit'} [waitUntil='load']
   */
  async goForward(waitUntil = 'load') {
    logger.info('[BasePage] Navigating forward');
    await this.page.goForward({ waitUntil });
    await this.waitForAngular();
  }

  /**
   * Wait for the page URL to match a string or regex.
   * @param {string|RegExp} urlOrPattern
   * @param {number} [timeout]
   */
  async waitForURL(urlOrPattern, timeout = this.getDefaultTimeout()) {
    logger.info(`[BasePage] Waiting for URL: ${urlOrPattern}`);
    await this.page.waitForURL(urlOrPattern, { timeout });
  }

  /**
   * Wait for the network to reach idle state.
   * @param {number} [timeout]
   */
  async waitForNetworkIdle(timeout = this.getDefaultTimeout()) {
    logger.info('[BasePage] Waiting for network idle');
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  // ─── Object State Resolution ───────────────────────────────────────────────────
  
  /**
   * Returns true if the element is currently visible on the page.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isElementVisible(selector, fallbacks = [], timeout = 5000) {
    try {
      const element = await this.resolveWithHealing(selector, fallbacks, timeout);
      return await element.isVisible();
    } catch {
      return false;
    }
  }
  
  /**
   * Returns true if the element is enabled.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isEnabled(selector, fallbacks = [], timeout = 5000) {
    try {
      const element = await this.resolveWithHealing(selector, fallbacks, timeout);
      return await element.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * Returns true if the element is disabled.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isDisabled(selector, fallbacks = [], timeout = 5000) {
    try {
      const element = await this.resolveWithHealing(selector, fallbacks, timeout);
      return await element.isDisabled();
    } catch {
      return true;
    }
  }

  /**
   * Ensure an element is visible and enabled before interacting with it.
   * Waits up to `timeout` milliseconds (default 30000). Returns the locator
   * when interactable, otherwise throws an Error.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=10000]
   * @returns {Promise<import('playwright').Locator>}
   */
  async ensureInteractable(selector, fallbacks = [], timeout = 10000) {
    logger.info(`[BasePage] Ensuring element is visible and enabled: "${selector}" (timeout: ${timeout}ms)`);
    const locator = await this.resolveWithHealing(selector, fallbacks, timeout);
    // Wait until visible
    await locator.waitFor({ state: 'visible', timeout });

    // Poll for enabled state until timeout
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await locator.isEnabled()) return locator;
      } catch (e) {
        // swallow transient errors and retry until timeout
      }
      await this.page.waitForTimeout(200);
    }

    throw new Error(`[BasePage] Element not enabled/ready: "${selector}" after ${timeout}ms`);
  }

  // ─── Click Actions ────────────────────────────────────────────────────────

  /**
   * Single left-click on the resolved element (with optional self-healing).
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async click(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Clicking element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.click();
    await this.waitForAngular();
  }

  /**
   * Double-click on the resolved element.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async doubleClick(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Double-clicking element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.dblclick();
    await this.waitForAngular();
  }

  /**
   * Right-click (context menu) on the resolved element.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async rightClick(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Right-clicking element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.click({ button: 'right' });
    await this.waitForAngular();
  }

  /**
   * Click an element at a specific offset from its top-left corner.
   * @param {string} selector
   * @param {{ x: number, y: number }} position
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async clickAt(selector, position, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Clicking element at position (${position.x}, ${position.y}): "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.click({ position });
    await this.waitForAngular();
  }

  /**
   * Click and hold, then release (useful for drag triggers).
   * @param {string} selector
   * @param {number} [holdMs=500]
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async clickAndHold(selector, holdMs = 500, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Click-and-hold on element: "${selector}" for ${holdMs}ms`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.hover();
    await this.page.mouse.down();
    await this.page.waitForTimeout(holdMs);
    await this.page.mouse.up();
    await this.waitForAngular();
  }

  // ─── Keyboard & Input ─────────────────────────────────────────────────────

  /**
   * Clear then fill an element with the given text.
   * @param {string} selector
   * @param {string} text
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async fill(selector, text, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Filling text in element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.fill(text);
    await this.waitForAngular();
  }

  /**
   * Type text character-by-character (simulates real keyboard input).
   * Useful for inputs that listen to `keydown`/`keyup` events.
   * @param {string} selector
   * @param {string} text
   * @param {number} [delay=50] Delay between keystrokes in milliseconds.
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async type(selector, text, delay = 50, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Typing text in element: "${selector}" (delay: ${delay}ms)`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.pressSequentially(text, { delay });
    await this.waitForAngular();
  }

  /**
   * Clear the value of an input field.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async clear(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Clearing element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.clear();
  }

  /**
   * Press one or more keyboard keys on a focused element.
   * Uses Playwright key notation, e.g. `'Enter'`, `'Tab'`, `'Control+A'`.
   * @param {string} selector
   * @param {string} key
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async pressKey(selector, key, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Pressing key "${key}" on element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.press(key);
    await this.waitForAngular();
  }

  /**
   * Press a global keyboard key (no element focus required).
   * @param {string} key  e.g. `'Escape'`, `'F5'`, `'Control+Shift+I'`
   */
  async pressKeyboard(key) {
    logger.info(`[BasePage] Pressing global keyboard key: "${key}"`);
    await this.page.keyboard.press(key);
  }

  /**
   * Focus an element without clicking it.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async focus(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Focusing element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.focus();
  }

  /**
   * Blur (remove focus from) an element.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async blur(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Blurring element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.blur();
  }

  /**
   * Select an option in a `<select>` element.
   * `value` may be a string (option value/label), an object `{ label }`,
   * `{ value }`, or `{ index }`, or an array of these for multi-select.
   * @param {string} selector
   * @param {string|string[]|object|object[]} value
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async selectOption(selector, value, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Selecting option in: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.selectOption(value);
    await this.waitForAngular();
  }

  /**
   * Upload one or more files via an `<input type="file">` element.
   * @param {string} selector
   * @param {string|string[]} filePaths  Absolute path(s) to the file(s).
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async uploadFile(selector, filePaths, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Uploading file(s) to: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.setInputFiles(filePaths);
  }

  // ─── Checkbox / Radio ─────────────────────────────────────────────────────

  /**
   * Check a checkbox or radio button.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async check(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Checking element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.check();
    await this.waitForAngular();
  }

  /**
   * Uncheck a checkbox.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async uncheck(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Unchecking element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.uncheck();
    await this.waitForAngular();
  }

  // ─── Mouse Interactions ───────────────────────────────────────────────────

  /**
   * Hover over an element to trigger tooltip or dropdown visibility.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async hover(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Hovering over element: "${selector}"`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.hover();
    await this.waitForAngular();
  }

  /**
   * Drag source element and drop it onto target element.
   * @param {string} sourceSelector
   * @param {string} targetSelector
   * @param {number} [timeout=5000]
   */
  async dragAndDrop(sourceSelector, targetSelector, timeout = 5000) {
    logger.info(`[BasePage] Drag "${sourceSelector}" → "${targetSelector}"`);
    const source = await this.ensureInteractable(sourceSelector, [], 30000);
    const target = await this.ensureInteractable(targetSelector, [], 30000);
    await source.dragTo(target);
    await this.waitForAngular();
  }

  /**
   * Scroll the page to the given absolute pixel coordinates.
   * @param {number} x
   * @param {number} y
   */
  async scrollTo(x, y) {
    logger.info(`[BasePage]Scrolling page to (${x}, ${y})`);
    await this.page.evaluate(([sx, sy]) => window.scrollTo(sx, sy), [x, y]);
  }

  /**
   * Scroll the matched element into the visible viewport.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async scrollIntoView(selector, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Scrolling element into view: "${selector}"`);
    const element = await this.resolveWithHealing(selector, fallbacks, timeout);
    await element.scrollIntoViewIfNeeded();
  }

  // ─── Dialog Handling ──────────────────────────────────────────────────────

  /**
   * Register a one-shot handler to accept the next browser dialog (alert/confirm/prompt).
   * Call this BEFORE the action that triggers the dialog.
   * @param {string} [promptText] Optional text to enter for prompt dialogs.
   */
  async acceptDialog(promptText = '') {
    logger.info('Registering dialog accept handler');
    this.page.once('dialog', async (dialog) => {
      logger.info(`[BasePage] [Dialog] type="${dialog.type()}" message="${dialog.message()}" → accepting`);
      await dialog.accept(promptText || undefined);
    });
  }

  /**
   * Register a one-shot handler to dismiss the next browser dialog.
   * Call this BEFORE the action that triggers the dialog.
   */
  async dismissDialog() {
    logger.info('Registering dialog dismiss handler');
    this.page.once('dialog', async (dialog) => {
      logger.info(`[BasePage] [Dialog] type="${dialog.type()}" message="${dialog.message()}" → dismissing`);
      await dialog.dismiss();
    });
  }

  // ─── Wait Conditions ──────────────────────────────────────────────────────

  /**
   * Wait until the element is visible in the viewport.
   * @param {string} selector
   * @param {number} [timeout]
   * @returns {Promise<import('playwright').Locator>}
   */
  async waitForVisible(selector, timeout = this.getDefaultTimeout()) {
    logger.info(`[BasePage] Waiting for visible: "${selector}"`);
    const locator = this.resolveLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    return locator;
  }

  /**
   * Wait until the element is hidden / detached from DOM.
   * @param {string} selector
   * @param {number} [timeout]
   */
  async waitForHidden(selector, timeout = this.getDefaultTimeout()) {
    logger.info(`[BasePage] Waiting for hidden: "${selector}"`);
    const locator = this.resolveLocator(selector);
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait until the element is attached to the DOM.
   * @param {string} selector
   * @param {number} [timeout]
   * @returns {Promise<import('playwright').Locator>}
   */
  async waitForAttached(selector, timeout = this.getDefaultTimeout()) {
    logger.info(`[BasePage] Waiting for attached: "${selector}"`);
    const locator = this.resolveLocator(selector);
    await locator.waitFor({ state: 'attached', timeout });
    return locator;
  }

  /**
   * Wait until the element is enabled (not disabled).
   * @param {string} selector
   * @param {number} [timeout]
   */
  async waitForEnabled(selector, timeout = this.getDefaultTimeout()) {
    logger.info(`[BasePage] Waiting for enabled: "${selector}"`);
    const locator = this.resolveLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await expect(locator).toBeEnabled({ timeout });
  }

  /**
   * Wait until the element contains the expected text.
   * @param {string} selector
   * @param {string|RegExp} text
   * @param {number} [timeout]
   */
  async waitForText(selector, text, timeout = this.getDefaultTimeout()) {
    logger.info(`[BasePage] Waiting for text "${text}" in: "${selector}"`);
    const locator = this.resolveLocator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    await expect(locator).toContainText(text, { timeout });
  }

  /**
   * Pause execution for a fixed amount of time.
   * Use sparingly — prefer explicit wait conditions.
   * @param {number} ms
   */
  async waitFor(ms) {
    logger.info(`[BasePage] Waiting for ${ms}ms`);
    await this.page.waitForTimeout(ms);
  }

  // ─── State Queries ────────────────────────────────────────────────────────

  /**
   * Get the trimmed inner text of an element.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<string>}
   */
  async getText(selector, fallbacks = [], timeout = 5000) {
    const element = await this.resolveWithHealing(selector, fallbacks, timeout);
    return await element.innerText();
  }

  /**
   * Get all inner text values of all matched elements.
   * @param {string} selector
   * @returns {Promise<string[]>}
   */
  async getAllText(selector) {
    logger.info(`[BasePage] Getting all text for: "${selector}"`);
    return await this.resolveLocator(selector).allInnerTexts();
  }

  /**
   * Get the `innerHTML` of an element.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<string>}
   */
  async getHtml(selector, fallbacks = [], timeout = 5000) {
    const element = await this.resolveWithHealing(selector, fallbacks, timeout);
    return await element.innerHTML();
  }

  /**
   * Get the current value of an `<input>`, `<textarea>`, or `<select>`.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<string>}
   */
  async getInputValue(selector, fallbacks = [], timeout = 5000) {
    const element = await this.resolveWithHealing(selector, fallbacks, timeout);
    return await element.inputValue();
  }

  /**
   * Get the value of a specific HTML attribute.
   * @param {string} selector
   * @param {string} attributeName
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<string|null>}
   */
  async getAttribute(selector, attributeName, fallbacks = [], timeout = 5000) {
    const element = await this.resolveWithHealing(selector, fallbacks, timeout);
    return await element.getAttribute(attributeName);
  }

  
  /**
   * Returns true if a checkbox or radio button is checked.
   * @param {string} selector
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async isChecked(selector, fallbacks = [], timeout = 5000) {
    const element = await this.resolveWithHealing(selector, fallbacks, timeout);
    return await element.isChecked();
  }

  /**
   * Returns true if the element's text content contains the expected string.
   * @param {string} selector
   * @param {string|RegExp} text
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   * @returns {Promise<boolean>}
   */
  async hasText(selector, text, fallbacks = [], timeout = 5000) {
    try {
      const content = await this.getText(selector, fallbacks, timeout);
      return text instanceof RegExp ? text.test(content) : content.includes(text);
    } catch {
      return false;
    }
  }

  /**
   * Count how many elements match the selector.
   * @param {string} selector
   * @returns {Promise<number>}
   */
  async getCount(selector) {
    logger.info(`[BasePage] Counting elements: "${selector}"`);
    return await this.resolveLocator(selector).count();
  }

  // ─── Screenshots & Scripts ────────────────────────────────────────────────

  /**
   * Take a full-page screenshot and save it to `savePath`.
   * @param {string} savePath  Absolute path including filename, e.g. `'/tmp/shot.png'`.
   */
  async screenshot(savePath) {
    logger.info(`[BasePage] Taking full-page screenshot: ${savePath}`);
    await this.page.screenshot({ path: savePath, fullPage: true });
  }

  /**
   * Take a screenshot of a single element.
   * @param {string} selector
   * @param {string} savePath
   * @param {string[]} [fallbacks=[]]
   * @param {number} [timeout=5000]
   */
  async elementScreenshot(selector, savePath, fallbacks = [], timeout = 5000) {
    logger.info(`[BasePage] Taking element screenshot for "${selector}": ${savePath}`);
    const element = await this.ensureInteractable(selector, fallbacks, 30000);
    await element.screenshot({ path: savePath });
  }

  /**
   * Execute arbitrary JavaScript in the browser context.
   * @param {string|Function} script  JS string or a function serialised to the browser.
   * @param {...*} args               Arguments forwarded to the script.
   * @returns {Promise<*>}
   */
  async executeScript(script, ...args) {
    logger.info(`[BasePage] Executing browser script`);
    return await this.page.evaluate(script, ...args);
  }

  // ─── Frames ───────────────────────────────────────────────────────────────

  /**
   * Return a Frame object matched by name or URL.
   * @param {string|RegExp} nameOrUrl
   * @returns {import('playwright').Frame|null}
   */
  getFrame(nameOrUrl) {
    logger.info(`[BasePage] Getting frame: ${nameOrUrl}`);
    return typeof nameOrUrl === 'string'
      ? this.page.frame({ name: nameOrUrl }) || this.page.frame({ url: nameOrUrl })
      : this.page.frame({ url: nameOrUrl });
  }

  /**
   * Return a Locator scoped to a frame identified by a CSS/semantic selector.
   * Use the returned locator exactly like `resolveLocator()` results.
   * @param {string} frameSelector  Selector for the `<iframe>` element.
   * @returns {import('playwright').FrameLocator}
   */
  getFrameLocator(frameSelector) {
    logger.info(`[BasePage] Getting frame locator: "${frameSelector}"`);
    return this.page.frameLocator(frameSelector);
  }

  // ─── Misc Utilities ───────────────────────────────────────────────────────

  /**
   * Return the current page title.
   * @returns {Promise<string>}
   */
  async getPageTitle() {
    return await this.page.title();
  }

  /**
   * Return the current page URL.
   * @returns {string}
   */
  getPageUrl() {
    return this.page.url();
  }

  /**
   * Get the configured execution timeout from ConfigManager.
   * @returns {number}
   */
  getDefaultTimeout() {
    return configManager.getExecutionConfig().timeout;
  }

  async waitForAngular() {
    await angularHelper.waitForAngularStability(this.page);
  }
}

export default BasePage;
export { BasePage };

