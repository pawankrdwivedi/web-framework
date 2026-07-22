import logger from '../logger/logger.js';
import { resolveFromAppRoot } from '../utils/path-resolver.js';
import configManager from '../config/config-manager.js';
import MountebankMockManager from './mountebank-mock-manager.js';
import fs from 'fs/promises';

/**
 * API record/playback coordinator using Mountebank only.
 */
class NetworkRecordPlaybackManager {
  constructor() {
    this._mountebankManager = null;
    this._mode = null;
    this._nativeRecordedStubs = [];
    this._imposterFilePath = null;
    this._activeScenario = null;
    this._mountebankImposterPort = 4545;
  }

  async init(_page, scenarioName = 'global') {
    this._mountebankManager = null;
    this._nativeRecordedStubs = [];

    const execConfig = configManager.getExecutionConfig() || {};
    const enableMountebank =
      String(process.env.MOCK_MOUNTEBANK || execConfig.mockMountebank || execConfig.MOCK_MOUNTEBANK || 'false') === 'true';
    const mountebankRecord =
      String(process.env.MOCK_MOUNTEBANK_RECORD || execConfig.mockMountebankRecord || execConfig.MOCK_MOUNTEBANK_RECORD || 'false') === 'true';
    const mountebankPlayback =
      String(process.env.MOCK_MOUNTEBANK_PLAYBACK || execConfig.mockMountebankPlayback || execConfig.MOCK_MOUNTEBANK_PLAYBACK || 'false') === 'true';
    const mountebankAdminHost =
      process.env.MOCK_MOUNTEBANK_ADMIN_HOST || execConfig.mockMountebankAdminHost || execConfig.MOCK_MOUNTEBANK_ADMIN_HOST || '127.0.0.1';
    const mountebankAdminPort =
      process.env.MOCK_MOUNTEBANK_ADMIN_PORT || execConfig.mockMountebankAdminPort || execConfig.MOCK_MOUNTEBANK_ADMIN_PORT || 2525;
    const mountebankImposterPort =
      process.env.MOCK_MOUNTEBANK_IMPOSTER_PORT || execConfig.mockMountebankImposterPort || execConfig.MOCK_MOUNTEBANK_IMPOSTER_PORT || 4545;
    const mountebankTargetUrl =
      process.env.MOCK_MOUNTEBANK_TARGET_URL || execConfig.mockMountebankTargetUrl || execConfig.MOCK_MOUNTEBANK_TARGET_URL || null;
    const mockInterceptPattern = 
      process.env.MOCK_INTERCEPT_PATTERN || execConfig.mockInterceptPattern || execConfig.MOCK_INTERCEPT_PATTERN || '**/api/**';

    this._mountebankImposterPort = mountebankImposterPort;
    this._mockInterceptPattern = mockInterceptPattern;

    if (!enableMountebank) {
      return;
    }
    if (mountebankRecord && mountebankPlayback) {
      const msg =
        'Validation Error: Both MOCK_MOUNTEBANK_RECORD and MOCK_MOUNTEBANK_PLAYBACK are set to "true". Please enable only one.';
      logger.error(msg);
      throw new Error(msg);
    }
    if (!mountebankRecord && !mountebankPlayback) {
      const msg =
        'Validation Error: MOCK_MOUNTEBANK=true requires MOCK_MOUNTEBANK_RECORD=true or MOCK_MOUNTEBANK_PLAYBACK=true.';
      logger.error(msg);
      throw new Error(msg);
    }

    const activeScenario = scenarioName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const mountebankDataDir = 'test_mock';
    const mockDataDir = resolveFromAppRoot(mountebankDataDir);
    const imposterFilePath = resolveFromAppRoot(
      mountebankDataDir,
      `mountebank-imposter-${activeScenario}.json`
    );
    
    this._activeScenario = activeScenario;
    this._imposterFilePath = imposterFilePath;

    this._mode = mountebankRecord ? 'record' : 'playback';
    logger.info(`[Mock] Mountebank ${this._mode.toUpperCase()} ACTIVE for scenario: ${activeScenario}`);

    if (this._mode === 'playback') {
      const mgr = new MountebankMockManager();
      mgr.configure({
        mode: this._mode,
        activeScenario,
        adminHost: mountebankAdminHost,
        adminPort: mountebankAdminPort,
        imposterPort: mountebankImposterPort,
        targetBaseUrl: mountebankTargetUrl || 'http://localhost:3000', // fallback since it's required internally but unused
        mockDataDir,
        imposterFilePath,
      });

      this._mountebankManager = mgr;
      await mgr.init();

      if (_page) {
        const imposterUrl = `http://127.0.0.1:${mountebankImposterPort}`;
        logger.info(`[Mock] Setting up global page.route for '${this._mockInterceptPattern}' -> ${imposterUrl}`);
        
        await _page.route(this._mockInterceptPattern, async (route) => {
          try {
            const request = route.request();
            if (!['fetch', 'xhr'].includes(request.resourceType())) {
              return route.continue();
            }

            const requestUrl = new URL(request.url());
            if (requestUrl.port === String(mountebankImposterPort)) {
              return route.continue();
            }

            const mockUrl = `${imposterUrl}${requestUrl.pathname}${requestUrl.search}`;
            logger.debug(`[Mock] Intercepting request: ${requestUrl.href} -> ${mockUrl}`);
            const response = await route.fetch({ url: mockUrl });
            await route.fulfill({ response });
          } catch (err) {
            logger.error(`[Mock] Failed to route request: ${err.message}`);
            await route.continue();
          }
        });
      }
    } else if (this._mode === 'record' && _page) {
      logger.info(`[Mock] Setting up native Playwright recording for '${this._mockInterceptPattern}'`);
      
      await _page.route(this._mockInterceptPattern, async (route) => {
        try {
          const request = route.request();
          
          if (!['fetch', 'xhr'].includes(request.resourceType())) {
            return route.continue();
          }

          const requestUrl = new URL(request.url());
          const response = await route.fetch();
          
          let responseBody = '';
          try {
            const buffer = await response.body();
            responseBody = buffer.toString('utf8');
          } catch (e) {
            // ignore binary or empty
          }

          const responseHeaders = response.headers();
          // Filter out hop-by-hop or dynamic headers to keep stubs clean
          delete responseHeaders['content-encoding'];

          this._nativeRecordedStubs.push({
            predicates: [
              { deepEquals: { method: request.method() } },
              { deepEquals: { path: requestUrl.pathname } }
            ],
            responses: [
              {
                is: {
                  statusCode: response.status(),
                  headers: responseHeaders,
                  body: responseBody
                }
              }
            ]
          });

          logger.debug(`[Mock] Native recorded: ${request.method()} ${requestUrl.pathname}`);
          await route.fulfill({ response });
        } catch (err) {
          logger.error(`[Mock] Failed to record request: ${err.message}`);
          await route.continue();
        }
      });
    }
  }

  async saveRecordedMocks() {
    if (this._mode === 'record') {
      const imposterPayload = {
        protocol: 'http',
        port: Number(this._mountebankImposterPort),
        name: `record-${this._activeScenario}`,
        recordRequests: false,
        stubs: this._nativeRecordedStubs
      };

      try {
        await fs.mkdir(resolveFromAppRoot('test_mock'), { recursive: true });
        await fs.writeFile(this._imposterFilePath, JSON.stringify(imposterPayload, null, 2));
        logger.info(`[Mock] Natively recorded mocks saved to ${this._imposterFilePath}`);
      } catch (err) {
        logger.error(`[Mock] Failed to save recorded mocks: ${err.message}`);
      }
    } else if (this._mountebankManager) {
      await this._mountebankManager.saveRecordedMocks();
    }
  }

  async stop() {
    if (this._mountebankManager) {
      try {
        await this._mountebankManager.deleteImposter(this._mountebankManager.imposterPort);
      } catch (err) {
        logger.debug(`[Mock] Ignored error deleting imposter during stop: ${err.message}`);
      }
      await this._mountebankManager.stopMockServer();
      this._mountebankManager = null;
    }
  }
}

export default new NetworkRecordPlaybackManager();