import logger from '../logger/Logger.js';
import { resolveFromAppRoot } from '../utils/path-resolver.js';
import configManager from '../config/config-manager.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * API record/playback coordinator using Hybrid Proxy Mocking Architecture.
 */
class NetworkRecordPlaybackManager {
  constructor() {
    this._mode = null;
    this._activeScenario = null;
    this._mockDataDir = null;
    this._writeQueue = new Map();
  }

  _generateMockKey(method, urlObj) {
    const methodPart = method.toUpperCase();
    let pathPart = urlObj.pathname.replace(/\//g, '_');
    if (pathPart.startsWith('_')) {
      pathPart = pathPart.substring(1);
    }
    if (pathPart.endsWith('_')) {
      pathPart = pathPart.substring(0, pathPart.length - 1);
    }

    return `${methodPart}_${pathPart}`;
  }

  async _ensureMockDir() {
    if (this._mockDataDir) {
      try {
        await fs.mkdir(this._mockDataDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
  }

  async init(_page, scenarioName = 'global') {
    //this._mountebankManager = null;

    const execConfig = configManager.getExecutionConfig() || {};
    const enableMountebank =
      String(process.env.MOCK_MOUNTEBANK || execConfig.mockMountebank || execConfig.MOCK_MOUNTEBANK || 'false') === 'true';
    const mountebankRecord =
      String(process.env.MOCK_MOUNTEBANK_RECORD || execConfig.mockMountebankRecord || execConfig.MOCK_MOUNTEBANK_RECORD || 'false') === 'true';
    const mountebankPlayback =
      String(process.env.MOCK_MOUNTEBANK_PLAYBACK || execConfig.mockMountebankPlayback || execConfig.MOCK_MOUNTEBANK_PLAYBACK || 'false') === 'true';
    const mockInterceptPattern =
      process.env.MOCK_INTERCEPT_PATTERN || execConfig.mockInterceptPattern || execConfig.MOCK_INTERCEPT_PATTERN || '**/api/**';

    const skipEndpointsStr = process.env.MOCK_SKIP_ENDPOINTS || execConfig.mockSkipEndpoints || execConfig.MOCK_SKIP_ENDPOINTS || '';
    this._mockSkipEndpoints = skipEndpointsStr.split(',').map(s => s.trim()).filter(s => s);
    const recordEndpointsStr = process.env.MOCK_RECORD_ENDPOINTS || execConfig.mockRecordEndpoints || execConfig.MOCK_RECORD_ENDPOINTS || '';
    this._mockRecordEndpoints = recordEndpointsStr.split(',').map(s => s.trim()).filter(s => s);

    this._mockInterceptPattern = mockInterceptPattern;

    if (!enableMountebank) {
      return;
    }
    if (mountebankRecord && mountebankPlayback) {
      const msg = '[API Mocking] Error: Both MOCK_MOUNTEBANK_RECORD and MOCK_MOUNTEBANK_PLAYBACK are set to "true". Please enable only one.';
      logger.error(msg);
      throw new Error(msg);
    }
    if (!mountebankRecord && !mountebankPlayback) {
      const msg = '[API Mocking] Error: MOCK_MOUNTEBANK=true requires MOCK_MOUNTEBANK_RECORD=true or MOCK_MOUNTEBANK_PLAYBACK=true.';
      logger.error(msg);
      throw new Error(msg);
    }

    const activeScenario = scenarioName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const mountebankDataDir = 'test-mock';
    this._mockDataDir = resolveFromAppRoot(mountebankDataDir);
    this._activeScenario = activeScenario;

    this._mode = mountebankRecord ? 'record' : 'playback';
    logger.info(`[API Mocking] Hybrid Proxy ${this._mode.toUpperCase()} ACTIVE for scenario: ${activeScenario}`);

    await this._ensureMockDir();

    if (this._mode === 'playback') {
      if (_page) {
        logger.info(`[API Mocking] Setting up Playwright playback routing for '${this._mockInterceptPattern}'`);

        await _page.route(this._mockInterceptPattern, async (route) => {
          try {
            const request = route.request();
            if (!['fetch', 'xhr'].includes(request.resourceType())) {
              return route.continue();
            }

            const requestUrl = new URL(request.url());
            const mockKey = this._generateMockKey(request.method(), requestUrl);
            const mockFilePath = path.join(this._mockDataDir, `${mockKey}.json`);

            try {
              const fileStat = await fs.stat(mockFilePath);
              if (fileStat.isFile()) {
                const mockContent = await fs.readFile(mockFilePath, 'utf8');
                const mockData = JSON.parse(mockContent);
                logger.debug(`[API Mocking] Mock Found! Fulfilling request: ${requestUrl.href} from ${mockKey}.json`);
                return route.fulfill({
                  status: mockData.statusCode,
                  headers: mockData.headers,
                  body: mockData.body
                });
              }
            } catch (e) {
              // File not found
            }

            logger.debug(`[API Mocking] Mock Not Found. Continuing to real backend: ${requestUrl.href}`);
            await route.continue();
          } catch (err) {
            logger.error(`[API Mocking] Failed to route request: ${err.message}`);
            await route.continue();
          }
        });
      }
    } else if (this._mode === 'record' && _page) {
      logger.info(`[API Mocking] Setting up Playwright recording for '${this._mockInterceptPattern}'`);

      _page.on('response', async (response) => {
        try {
          const request = response.request();

          if (!['fetch', 'xhr'].includes(request.resourceType())) {
            return;
          }

          const requestUrl = new URL(request.url());

          // Skip patterns take precedence: if path matches any skip pattern, do not record.
          const shouldSkip = this._mockSkipEndpoints.some(skipPattern => requestUrl.pathname.includes(skipPattern));
          if (shouldSkip) {
            logger.debug(`[API Mocking] Skipping recording for: ${requestUrl.pathname} (matched skip pattern)`);
            return;
          }

          // If record endpoints were specified, only record requests whose pathname includes one of those patterns.
          if (this._mockRecordEndpoints && this._mockRecordEndpoints.length > 0) {
            const matchesRecord = this._mockRecordEndpoints.some(recPattern => requestUrl.pathname.includes(recPattern));
            if (!matchesRecord) {
              logger.debug(`[API Mocking] Skipping recording for: ${requestUrl.pathname} (did not match any record pattern)`);
              return;
            }
          }

          let responseBody = '';
          try {
            const buffer = await response.body();
            responseBody = buffer.toString('utf8');
          } catch (e) {
            // ignore binary or empty
          }

          if (responseBody.trim() === '') {
            logger.debug(`[API Mocking] Skipping recording for: ${requestUrl.pathname} (empty body)`);
            return;
          }

          const responseHeaders = response.headers();
          delete responseHeaders['content-encoding'];

          const contentType = responseHeaders['content-type'] || '';
          if (!contentType.toLowerCase().includes('charset=utf-8') && responseBody === '') {
            // we skip non-text types unless they have stringifiable bodies? We'll keep the check.
            logger.debug(`[API Mocking] Skipping recording for: ${requestUrl.pathname} (content-type does not contain charset=utf-8)`);
            return;
          }

          const mockKey = this._generateMockKey(request.method(), requestUrl);
          const mockFilePath = path.join(this._mockDataDir, `${mockKey}.json`);

          const mockData = {
            method: request.method(),
            endpoint: requestUrl.pathname,
            statusCode: response.status(),
            headers: responseHeaders,
            body: responseBody
          };

          const saveMock = async () => {
            try {
              const existingContent = await fs.readFile(mockFilePath, 'utf8');
              const existingData = JSON.parse(existingContent);
              const existingBodyLength = existingData.body ? existingData.body.length : 0;
              const newBodyLength = responseBody ? responseBody.length : 0;
              if (newBodyLength <= existingBodyLength) {
                logger.debug(`[API Mocking] Skipping save for ${mockKey}.json, existing mock has equal or larger body.`);
                return;
              }
            } catch (e) {
              // File doesn't exist or is invalid JSON, proceed to save
            }

            const tempFilePath = `${mockFilePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
            await fs.writeFile(tempFilePath, JSON.stringify(mockData, null, 2), 'utf8');
            await fs.rename(tempFilePath, mockFilePath);
            logger.debug(`[API Mocking] Recorded mock saved: ${mockKey}.json`);
          };

          const prevPromise = this._writeQueue.get(mockKey) || Promise.resolve();
          const currentPromise = prevPromise.then(() => saveMock()).catch(err => {
            logger.error(`[API Mocking] Failed to save mock ${mockKey}: ${err.message}`);
          });
          this._writeQueue.set(mockKey, currentPromise);
        } catch (err) {
          logger.error(`[API Mocking] Failed to record request: ${err.message}`);
        }
      });
    }
  }

  async saveRecordedMocks() {
    // With the new architecture, mocks are saved immediately in _page.on('response').
    // So this method doesn't need to do anything for native Playwright recording.
    if (this._mode === 'record') {
      logger.info(`[API Mocking] Recorded mocks are saved directly to ${this._mockDataDir}`);
    }
  }

  async stop() {
    // No-op for Playwright-native recording mode
  }
}

export default new NetworkRecordPlaybackManager();