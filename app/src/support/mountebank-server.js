import path from 'path';
import { logger, mountebankMockManager } from 'qe-framework-core';

function sanitizeScenarioName(scenarioName) {
  return String(scenarioName || 'global').replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

class MountebankServer {
  constructor() {
    this.manager = null;
    this.mode = null;
  }

  getModeFromEnv() {
    const enableMountebank = String(process.env.MOCK_MOUNTEBANK || 'false') === 'true';
    const recordEnabled = String(process.env.MOCK_MOUNTEBANK_RECORD || 'false') === 'true';
    const playbackEnabled = String(process.env.MOCK_MOUNTEBANK_PLAYBACK || 'false') === 'true';

    if (!enableMountebank) {
      throw new Error('MOCK_MOUNTEBANK=true is required to start Mountebank server.');
    }
    if (recordEnabled && playbackEnabled) {
      throw new Error('Both MOCK_MOUNTEBANK_RECORD and MOCK_MOUNTEBANK_PLAYBACK are true. Enable only one.');
    }
    if (!recordEnabled && !playbackEnabled) {
      throw new Error('Set either MOCK_MOUNTEBANK_RECORD=true or MOCK_MOUNTEBANK_PLAYBACK=true.');
    }

    return recordEnabled ? 'record' : 'playback';
  }

  async startPlayback(options = {}) {
    const appRoot = path.basename(process.cwd()) === 'app' ? process.cwd() : path.join(process.cwd(), 'app');
    const scenario = sanitizeScenarioName(options.scenarioName || 'montebank_server_demo');
    const adminHost = options.adminHost || process.env.MOCK_MOUNTEBANK_ADMIN_HOST || '127.0.0.1';
    const adminPort = Number(options.adminPort || process.env.MOCK_MOUNTEBANK_ADMIN_PORT || 2525);
    const imposterPort = Number(options.imposterPort || process.env.MOCK_MOUNTEBANK_IMPOSTER_PORT || 4545);
    const mockDataDir = path.join(appRoot, 'test_mock');
    const imposterFilePath = options.imposterFilePath || path.join(mockDataDir, `mountebank-imposter-${scenario}.json`);

    const manager = new mountebankMockManager();
    manager.configure({
      mode: 'playback',
      activeScenario: scenario,
      adminHost,
      adminPort,
      imposterPort,
      mockDataDir,
      imposterFilePath,
    });
    await manager.init();

    this.manager = manager;
    this.mode = 'playback';
    logger.info(`[Moconst scenariontebankServer] Playback started on http://127.0.0.1:${imposterPort}`);
    return { imposterBaseUrl: `http://127.0.0.1:${imposterPort}`, imposterFilePath };
  }

  async startRecord(options = {}) {
    const appRoot = path.basename(process.cwd()) === 'app' ? process.cwd() : path.join(process.cwd(), 'app');
    const scenario = sanitizeScenarioName(options.scenarioName || 'montebank_server_record_demo');
    const adminHost = options.adminHost || process.env.MOCK_MOUNTEBANK_ADMIN_HOST || '127.0.0.1';
    const adminPort = Number(options.adminPort || process.env.MOCK_MOUNTEBANK_ADMIN_PORT || 2525);
    const imposterPort = Number(options.imposterPort || process.env.MOCK_MOUNTEBANK_IMPOSTER_PORT || 4545);
    const targetBaseUrl = options.targetBaseUrl || process.env.MOCK_MOUNTEBANK_TARGET_URL;
    if (!targetBaseUrl) {
      throw new Error('targetBaseUrl is required to start montebank server in record mode.');
    }
    const mockDataDir = path.join(appRoot, 'test_mock');
    const imposterFilePath = options.imposterFilePath || path.join(mockDataDir, `mountebank-imposter-${scenario}.json`);

    const manager = new mountebankMockManager();
    manager.configure({
      mode: 'record',
      activeScenario: scenario,
      adminHost,
      adminPort,
      imposterPort,
      targetBaseUrl,
      mockDataDir,
      imposterFilePath,
    });
    await manager.init();

    this.manager = manager;
    this.mode = 'record';
    logger.info(`[MontebankServer] Record mode started on http://127.0.0.1:${imposterPort}`);
    return { imposterBaseUrl: `http://127.0.0.1:${imposterPort}`, imposterFilePath };
  }

  async startFromEnv(options = {}) {
    const mode = this.getModeFromEnv();
    if (mode === 'record') {
      return this.startRecord(options);
    }
    return this.startPlayback(options);
  }

  async stop(saveRecordedMocks = false) {
    if (!this.manager) {
      return;
    }

    if (saveRecordedMocks && this.mode === 'record') {
      await this.manager.saveRecordedMocks();
    }
    await this.manager.deleteImposter(this.manager.imposterPort);
    await this.manager.stopMockServer();
    this.manager = null;
    this.mode = null;
    logger.info('[MontebankServer] Server and imposter stopped.');
  }
}

const mountebankServer = new MountebankServer();
export default mountebankServer;
export { MountebankServer };
