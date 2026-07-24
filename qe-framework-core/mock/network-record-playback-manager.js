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
    
    const skipEndpointsStr = process.env.MOCK_SKIP_ENDPOINTS || execConfig.mockSkipEndpoints || execConfig.MOCK_SKIP_ENDPOINTS || '';
    this._mockSkipEndpoints = skipEndpointsStr.split(',').map(s => s.trim()).filter(s => s);

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
      
      _page.on('response', async (response) => {
        try {
          const request = response.request();
          
          if (!['fetch', 'xhr'].includes(request.resourceType())) {
            return;
          }

          const requestUrl = new URL(request.url());
          
          const shouldSkip = this._mockSkipEndpoints.some(skipPattern => requestUrl.pathname.includes(skipPattern));
          if (shouldSkip) {
            logger.debug(`[Mock] Skipping recording for: ${requestUrl.pathname}`);
            return;
          }
          
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

          const contentType = responseHeaders['content-type'] || '';
          if (!contentType.toLowerCase().includes('charset=utf-8')) {
            logger.debug(`[Mock] Skipping recording for: ${requestUrl.pathname} (content-type does not contain charset=utf-8)`);
            return;
          }

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
        } catch (err) {
          logger.error(`[Mock] Failed to record request: ${err.message}`);
        }
      });
    }
  }

  async saveRecordedMocks() {
    if (this._mode === 'record') {
      try {
        const mockDataDir = resolveFromAppRoot('test_mock');
        await fs.mkdir(mockDataDir, { recursive: true });

        // Group stubs by the last segment of the path
        const stubsBySegment = {};
        for (const stub of this._nativeRecordedStubs) {
          const pathPredicate = stub.predicates.find(p => p.deepEquals && p.deepEquals.path);
          if (!pathPredicate) continue;
          const reqPath = pathPredicate.deepEquals.path;
          
          // Get last segment
          const segments = reqPath.split('/').filter(s => s);
          const segment = segments.length > 0 ? segments[segments.length - 1] : 'root';
          
          if (!stubsBySegment[segment]) {
            stubsBySegment[segment] = [];
          }
          stubsBySegment[segment].push(stub);
        }

        for (const [segment, stubs] of Object.entries(stubsBySegment)) {
          const filePath = resolveFromAppRoot('test_mock', `imposter-${segment}.json`);
          let existingData = {
            protocol: 'http',
            port: Number(this._mountebankImposterPort),
            name: `record-${segment}`,
            recordRequests: false,
            stubs: []
          };

          try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            existingData = JSON.parse(fileContent);
          } catch (e) {
            // File doesn't exist or is invalid, use default
          }

          // Merge stubs - replace existing stub if method and path match
          for (const newStub of stubs) {
            const newMethod = newStub.predicates.find(p => p.deepEquals && p.deepEquals.method)?.deepEquals.method;
            const newPath = newStub.predicates.find(p => p.deepEquals && p.deepEquals.path)?.deepEquals.path;
            
            const existingIndex = existingData.stubs.findIndex(existingStub => {
              const existingMethod = existingStub.predicates?.find(p => p.deepEquals && p.deepEquals.method)?.deepEquals.method;
              const existingPath = existingStub.predicates?.find(p => p.deepEquals && p.deepEquals.path)?.deepEquals.path;
              return existingMethod === newMethod && existingPath === newPath;
            });

            if (existingIndex >= 0) {
              existingData.stubs[existingIndex] = newStub;
            } else {
              existingData.stubs.push(newStub);
            }
          }

          await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
          logger.info(`[Mock] Natively recorded mocks saved to ${filePath}`);
        }
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