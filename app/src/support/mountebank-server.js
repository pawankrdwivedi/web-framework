import fs from 'fs';
import path from 'path';
import { logger } from 'qe-framework-core';

function sanitizeScenarioName(scenarioName) {
  return String(scenarioName || 'global').replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

class MountebankServer {
  constructor() {
    this.mode = null;
    this.imposterFilePath = null;
  }

  getModeFromEnv() {
    const enableMountebank = String(process.env.MOCK_MOUNTEBANK || 'false') === 'true';
    const recordEnabled = String(process.env.MOCK_MOUNTEBANK_RECORD || 'false') === 'true';
    const playbackEnabled = String(process.env.MOCK_MOUNTEBANK_PLAYBACK || 'false') === 'true';

    if (!enableMountebank) {
      throw new Error('MOCK_MOUNTEBANK=true is required to use mountebank-server shim.');
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
    const mockDataDir = path.join(appRoot, 'test-mock');
    const imposterFilePath = options.imposterFilePath || path.join(mockDataDir, `mountebank-imposter-${scenario}.json`);

    this.mode = 'playback';
    this.imposterFilePath = imposterFilePath;

    logger.info(`[Mountebank Shim] Playback mode (shim) selected. Imposter file: ${imposterFilePath}`);
    return { imposterBaseUrl: `file://${imposterFilePath}`, imposterFilePath };
  }

  async startRecord(options = {}) {
    const appRoot = path.basename(process.cwd()) === 'app' ? process.cwd() : path.join(process.cwd(), 'app');
    const scenario = sanitizeScenarioName(options.scenarioName || 'montebank_server_record_demo');
    const mockDataDir = path.join(appRoot, 'test-mock');
    const imposterFilePath = options.imposterFilePath || path.join(mockDataDir, `mountebank-imposter-${scenario}.json`);

    this.mode = 'record';
    this.imposterFilePath = imposterFilePath;

    logger.info(`[Mountebank Shim] Record mode (shim) selected. Imposter file: ${imposterFilePath}`);
    return { imposterBaseUrl: `file://${imposterFilePath}`, imposterFilePath };
  }

  async startFromEnv(options = {}) {
    const mode = this.getModeFromEnv();
    if (mode === 'record') return this.startRecord(options);
    return this.startPlayback(options);
  }

  async stop(saveRecordedMocks = false) {
    // shim is a no-op for stopping
    if (saveRecordedMocks && this.mode === 'record') {
      logger.info('[Mountebank Shim] saveRecordedMocks requested but shim does not manage recordings.');
    }
    this.mode = null;
    this.imposterFilePath = null;
    logger.info('[Mountebank Shim] stopped.');
  }

  async callImposterEndpoint(_endpointPath) {
    // Basic shim: return the contents of the imposter file as the response body
    if (!this.imposterFilePath || !fs.existsSync(this.imposterFilePath)) {
      return { status: 404, data: null };
    }

    try {
      const content = fs.readFileSync(this.imposterFilePath, 'utf8');
      const json = JSON.parse(content);
      return { status: 200, data: json };
    } catch (err) {
      logger.warn(`[Mountebank Shim] Failed to read imposter file: ${err.message}`);
      return { status: 500, data: null };
    }
  }
}

const mountebankServer = new MountebankServer();
export default mountebankServer;
export { MountebankServer };
