import logger from '../logger/logger.js';
import { resolveFromAppRoot } from '../utils/path-resolver.js';
import configManager from '../config/config-manager.js';
import MountebankMockManager from './mountebank-mock-manager.js';

/**
 * API record/playback coordinator using Mountebank only.
 */
class NetworkRecordPlaybackManager {
  constructor() {
    this._mountebankManager = null;
  }

  async init(_page, scenarioName = 'global') {
    this._mountebankManager = null;

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
    if (mountebankRecord && !mountebankTargetUrl) {
      const msg = 'Validation Error: MOCK_MOUNTEBANK_TARGET_URL is required when MOCK_MOUNTEBANK_RECORD=true.';
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

    const mode = mountebankRecord ? 'record' : 'playback';
    logger.info(`[Mock] Mountebank ${mode.toUpperCase()} ACTIVE for scenario: ${activeScenario}`);

    const mgr = new MountebankMockManager();
    mgr.configure({
      mode,
      activeScenario,
      adminHost: mountebankAdminHost,
      adminPort: mountebankAdminPort,
      imposterPort: mountebankImposterPort,
      targetBaseUrl: mountebankTargetUrl,
      mockDataDir,
      imposterFilePath,
    });

    this._mountebankManager = mgr;
    await mgr.init();
  }

  async saveRecordedMocks() {
    if (this._mountebankManager) {
      await this._mountebankManager.saveRecordedMocks();
    }
  }

  async stop() {
    if (!this._mountebankManager) {
      return;
    }
    await this._mountebankManager.deleteImposter(this._mountebankManager.imposterPort);
    await this._mountebankManager.stopMockServer();
    this._mountebankManager = null;
  }
}

export default new NetworkRecordPlaybackManager();