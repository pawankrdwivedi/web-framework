import logger from '../logger/logger.js';

/**
 * RuntimeDataManager — cross-scenario shared data store.
 *
 * Stores key/value pairs during test execution so that data produced
 * in one scenario (or step) can be consumed by any subsequent scenario.
 *
 * Usage in step definitions (via this.runtime):
 *   this.runtime.set('accountId', '12345');           // store
 *   const id = this.runtime.get('accountId');         // retrieve
 *   this.runtime.setAll({ foo: 'bar', baz: 1 });      // bulk store
 *   this.runtime.delete('accountId');                 // remove one key
 *   this.runtime.clear();                             // remove everything
 *
 * Namespaced usage (group related keys under a tag / scenario name):
 *   this.runtime.setNs('registration', 'userId', 'abc');
 *   const uid = this.runtime.getNs('registration', 'userId');
 */
class RuntimeDataManager {
  constructor() {
    /** @type {Map<string, any>} flat key/value store */
    this._store = new Map();

    /** @type {Map<string, Map<string, any>>} namespace → key/value store */
    this._nsStore = new Map();
  }

  // ─── Flat API ──────────────────────────────────────────────────────────────

  /**
   * Store a single value under `key`.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    this._store.set(key, value);
    logger.debug(`[RuntimeDataManager] SET "${key}" = ${JSON.stringify(value)}`);
  }

  /**
   * Retrieve the value stored under `key`.
   * Returns `undefined` when the key is absent.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    const value = this._store.get(key);
    logger.debug(`[RuntimeDataManager] GET "${key}" = ${JSON.stringify(value)}`);
    return value;
  }

  /**
   * Returns `true` when `key` is present in the store.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this._store.has(key);
  }

  /**
   * Bulk-store multiple key/value pairs.
   * @param {Record<string, any>} dataObject
   */
  setAll(dataObject = {}) {
    for (const [key, value] of Object.entries(dataObject)) {
      this.set(key, value);
    }
  }

  /**
   * Return a plain object snapshot of the entire flat store.
   * @returns {Record<string, any>}
   */
  getAll() {
    return Object.fromEntries(this._store);
  }

  /**
   * Remove a single key from the flat store.
   * @param {string} key
   */
  delete(key) {
    this._store.delete(key);
    logger.debug(`[RuntimeDataManager] DELETE "${key}"`);
  }

  /**
   * Wipe the entire flat store (optionally also wipe all namespaces).
   * @param {boolean} [includeNamespaces=false]
   */
  clear(includeNamespaces = false) {
    this._store.clear();
    if (includeNamespaces) {
      this._nsStore.clear();
      logger.debug('[RuntimeDataManager] CLEARED flat store + all namespaces');
    } else {
      logger.debug('[RuntimeDataManager] CLEARED flat store');
    }
  }

  // ─── Namespaced API ────────────────────────────────────────────────────────

  /**
   * Store a value under `namespace → key`.
   * @param {string} namespace  e.g. a scenario tag or feature name
   * @param {string} key
   * @param {*} value
   */
  setNs(namespace, key, value) {
    if (!this._nsStore.has(namespace)) {
      this._nsStore.set(namespace, new Map());
    }
    this._nsStore.get(namespace).set(key, value);
    logger.debug(`[RuntimeDataManager] SET_NS [${namespace}] "${key}" = ${JSON.stringify(value)}`);
  }

  /**
   * Retrieve a value from `namespace → key`.
   * Returns `undefined` when the namespace or key is absent.
   * @param {string} namespace
   * @param {string} key
   * @returns {*}
   */
  getNs(namespace, key) {
    const value = this._nsStore.get(namespace)?.get(key);
    logger.debug(`[RuntimeDataManager] GET_NS [${namespace}] "${key}" = ${JSON.stringify(value)}`);
    return value;
  }

  /**
   * Returns `true` when `namespace → key` exists.
   * @param {string} namespace
   * @param {string} key
   * @returns {boolean}
   */
  hasNs(namespace, key) {
    return this._nsStore.get(namespace)?.has(key) ?? false;
  }

  /**
   * Return a plain object snapshot of a single namespace.
   * @param {string} namespace
   * @returns {Record<string, any>}
   */
  getAllNs(namespace) {
    const ns = this._nsStore.get(namespace);
    return ns ? Object.fromEntries(ns) : {};
  }

  /**
   * Remove a single key from a namespace.
   * @param {string} namespace
   * @param {string} key
   */
  deleteNs(namespace, key) {
    this._nsStore.get(namespace)?.delete(key);
    logger.debug(`[RuntimeDataManager] DELETE_NS [${namespace}] "${key}"`);
  }

  /**
   * Clear an entire namespace.
   * @param {string} namespace
   */
  clearNs(namespace) {
    this._nsStore.delete(namespace);
    logger.debug(`[RuntimeDataManager] CLEARED namespace "${namespace}"`);
  }

  // ─── Diagnostics ──────────────────────────────────────────────────────────

  /**
   * Dump the complete state of the store to the logger (debug level).
   */
  dump() {
    logger.debug('[RuntimeDataManager] === Store Dump ===');
    logger.debug(`Flat store: ${JSON.stringify(this.getAll(), null, 2)}`);
    for (const [ns] of this._nsStore) {
      logger.debug(`Namespace "${ns}": ${JSON.stringify(this.getAllNs(ns), null, 2)}`);
    }
    logger.debug('[RuntimeDataManager] ================');
  }
}

// Singleton — shared across all scenario World instances within the process
const runtimeDataManager = new RuntimeDataManager();
export default runtimeDataManager;
export { RuntimeDataManager };
