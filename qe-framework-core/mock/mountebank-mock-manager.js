import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import logger from '../logger/logger.js';
import { resolveFromAppRoot } from '../utils/path-resolver.js';

class MountebankMockManager {
  constructor() {
    this.activeScenario = 'global';
    this.mode = null;
    this.adminHost = '127.0.0.1';
    this.adminPort = 2525;
    this.imposterPort = 4545;
    this.protocol = 'http';
    this.targetBaseUrl = null;
    this.mockDataDir = null;
    this.imposterFilePath = null;
    this._mbProcess = null;
    this._ownsMbProcess = false;
    this._exitHookRegistered = false;
  }

  get adminBaseUrl() {
    return `http://${this.adminHost}:${this.adminPort}`;
  }

  configure(options = {}) {
    const activeScenario = String(options.activeScenario || 'global')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

    this.activeScenario = activeScenario;
    this.mode = options.mode || this.mode;
    this.adminHost = options.adminHost || this.adminHost;
    this.adminPort = Number(options.adminPort || this.adminPort);
    this.imposterPort = Number(options.imposterPort || this.imposterPort);
    this.protocol = options.protocol || this.protocol;
    this.targetBaseUrl = options.targetBaseUrl || this.targetBaseUrl;
    this.mockDataDir = options.mockDataDir || resolveFromAppRoot('test_mock');
    this.imposterFilePath =
      options.imposterFilePath ||
      path.join(this.mockDataDir, `mountebank-imposter-${this.activeScenario}.json`);
  }

  async init() {
    if (!this.mode) {
      throw new Error('[Mountebank] mode must be configured as "record" or "playback".');
    }

    await this.startMockServer();
    await this.deleteImposter(this.imposterPort);

    if (this.mode === 'record') {
      const imposter = this.buildRecordImposterPayload();
      await this.createImposter(imposter);
      logger.info(`[Mountebank] Record imposter created on port ${this.imposterPort}`);
      return;
    }

    if (this.mode === 'playback') {
      const imposter = this.loadPlaybackImposterPayload();
      await this.createImposter(imposter);
      logger.info(`[Mountebank] Playback imposter created on port ${this.imposterPort}`);
      return;
    }

    throw new Error(`[Mountebank] Unsupported mode: ${this.mode}`);
  }

  async saveRecordedMocks() {
    if (this.mode !== 'record') return;

    const response = await axios.get(
      `${this.adminBaseUrl}/imposters/${this.imposterPort}`,
      {
        params: { replayable: true, removeProxies: true },
        timeout: 20000,
      }
    );

    const imposter = response.data || {};
    if (!Array.isArray(imposter.stubs) || imposter.stubs.length === 0) {
      throw new Error(
        `[Mountebank] No recorded stubs found for imposter port ${this.imposterPort}`
      );
    }

    if (!fs.existsSync(this.mockDataDir)) {
      fs.mkdirSync(this.mockDataDir, { recursive: true });
    }

    fs.writeFileSync(this.imposterFilePath, JSON.stringify(imposter, null, 2));
    logger.info(`[Mountebank] Recorded stubs saved to ${this.imposterFilePath}`);
  }

  buildRecordImposterPayload() {
    if (!this.targetBaseUrl) {
      throw new Error(
        '[Mountebank] targetBaseUrl is required for record mode (MOCK_MOUNTEBANK_TARGET_URL).'
      );
    }

    return {
      protocol: this.protocol,
      port: this.imposterPort,
      name: `record-${this.activeScenario}`,
      stubs: [
        {
          responses: [
            {
              proxy: {
                to: this.targetBaseUrl,
                mode: 'proxyOnce',
                predicateGenerators: [
                  {
                    matches: {
                      method: true,
                      path: true,
                      query: true,
                      body: true,
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
  }

  loadPlaybackImposterPayload() {
    if (!this.imposterFilePath || !fs.existsSync(this.imposterFilePath)) {
      throw new Error(
        `[Mountebank] Playback imposter file not found: ${this.imposterFilePath}`
      );
    }

    const data = JSON.parse(fs.readFileSync(this.imposterFilePath, 'utf8'));
    if (!data || !Array.isArray(data.stubs) || data.stubs.length === 0) {
      throw new Error(
        `[Mountebank] Invalid imposter payload in file: ${this.imposterFilePath}`
      );
    }

    return {
      ...data,
      protocol: this.protocol,
      port: this.imposterPort,
      name: data.name || `playback-${this.activeScenario}`,
    };
  }

  async createImposter(imposterPayload) {
    await axios.post(`${this.adminBaseUrl}/imposters`, imposterPayload, {
      timeout: 20000,
    });
  }

  async deleteImposter(imposterPort) {
    try {
      await axios.delete(`${this.adminBaseUrl}/imposters/${imposterPort}`, {
        timeout: 10000,
      });
      logger.info(`[Mountebank] Deleted imposter on port ${imposterPort}`);
    } catch (err) {
      if (err.response && err.response.status === 404) return;
      throw err;
    }
  }

  async resetImposter(imposterPort = this.imposterPort) {
    await axios.put(
      `${this.adminBaseUrl}/imposters/${imposterPort}/_requests`,
      { requests: [] },
      { timeout: 10000 }
    );
  }

  async startMockServer() {
    const isRunning = await this.isServerRunning();
    if (isRunning) {
      logger.info(
        `[Mountebank] Reusing existing server at ${this.adminHost}:${this.adminPort}`
      );
      return;
    }

    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const args = [
      '--no-install',
      'mountebank',
      'start',
      '--host',
      this.adminHost,
      '--port',
      String(this.adminPort),
      '--allowInjection',
      '--loglevel',
      'warn',
    ];

    const spawnOptions = {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: process.platform === 'win32',
      env: { ...process.env, NODE_NO_WARNINGS: '1' },
    };

    this._mbProcess = spawn(npxCommand, args, spawnOptions);
    this._ownsMbProcess = true;

    this._mbProcess.stdout.on('data', (chunk) => {
      logger.debug(`[Mountebank] ${String(chunk).trim()}`);
    });
    this._mbProcess.stderr.on('data', (chunk) => {
      logger.warn(`[Mountebank] ${String(chunk).trim()}`);
    });

    const serverStartTimeoutMs = process.platform === 'win32' ? 120000 : 30000;
    await this.waitForServer(serverStartTimeoutMs);
    this.registerExitHook();
    logger.info(
      `[Mountebank] Server started at ${this.adminHost}:${this.adminPort}`
    );
  }

  async stopMockServer() {
    if (!this._mbProcess || !this._ownsMbProcess) return;
    this._mbProcess.kill();
    this._mbProcess = null;
    this._ownsMbProcess = false;
  }

  async isServerRunning() {
    try {
      const response = await axios.get(`${this.adminBaseUrl}/imposters`, {
        timeout: 3000,
      });
      return response.status >= 200 && response.status < 300;
    } catch (err) {
      return false;
    }
  }

  async waitForServer(timeoutMs = 30000, intervalMs = 500) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.isServerRunning()) return;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(
      `[Mountebank] Server did not start within ${timeoutMs}ms on ${this.adminHost}:${this.adminPort}`
    );
  }

  registerExitHook() {
    if (this._exitHookRegistered) return;
    this._exitHookRegistered = true;

    process.on('exit', () => {
      if (this._mbProcess && this._ownsMbProcess) {
        this._mbProcess.kill();
      }
    });
  }
}

export default MountebankMockManager;
export { MountebankMockManager };
