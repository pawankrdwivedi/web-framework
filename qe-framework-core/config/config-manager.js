import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import logger from '../logger/logger.js';
import dotenv from 'dotenv';

class ConfigManager {
  constructor() {
    this.config = null;
    this.envVars = this.loadEnvFile();
    this.env = this.determineEnvironment();
    this.application = this.determineApplication();
    this.loadConfig();
  }

  loadEnvFile() {
    try {
      const searchPaths = [
        path.join(process.cwd(), '.env')
        //path.join(process.cwd(), 'app.env'),
      ];
      
      let parsed = {};
      let loadedAny = false;
      
      for (const envPath of searchPaths) {
        if (fs.existsSync(envPath)) {
          const result = dotenv.config({ path: envPath });
          //logger.info(`Loaded environment file: ${envPath}`);
          parsed = { ...parsed, ...(result.parsed || {}) };
          loadedAny = true;
        }
      }
      
      if (!loadedAny) {
        logger.warn('No environment configuration file found (.env or app.env), using system environment variables');
      }
      
      //logger.info('--- Environment Variables Loaded ---');
      for (const [key, value] of Object.entries(parsed)) {
        //logger.info(`ENV: ${key} = ${value}`);
      }
      //logger.info('------------------------------------');
      
      return parsed;
    } catch (error) {
      logger.warn(`Failed to load environment files: ${error.message}`);
      return {};
    }
  }

  determineEnvironment() {
    const envFromFile = this.envVars.ENV || this.envVars.ENVIRONMENT;
    if (!envFromFile) {
      throw new Error('ENV variable is missing in .env file');
    }
    //logger.info(`Environment determined from .env file: ${envFromFile}`);
    return envFromFile.toLowerCase();
  }

  determineApplication() {
    const applicationFromFile = this.envVars.APP || this.envVars.APPLICATION;
    if (!applicationFromFile) {
      throw new Error('APP variable is missing in .env file');
    }
    //logger.info(`Application determined from .env file: ${applicationFromFile}`);
    return applicationFromFile.toLowerCase();
  }

  loadConfig() {
    try {
      const configFileName = `${this.env}.yaml`;
      const configDirName = 'config';
      const baseConfigPath = fs.existsSync(path.join(process.cwd(), 'src', configDirName))
        ? path.join(process.cwd(), 'src', configDirName)
        : path.join(process.cwd(), configDirName);

      const configFilePath = path.join(baseConfigPath, configFileName);
 
      if (!fs.existsSync(configFilePath)) {
        throw new Error(`Configuration file not found at: ${configFilePath}`);
      }
      logger.info('--- YAML Configuration Loaded ---');
      logger.info(`Application: ${this.application.toUpperCase() || 'undefined'}, Environment: ${this.env.toUpperCase()}`);
      const fileContents = fs.readFileSync(configFilePath, 'utf8');
      this.config = yaml.load(fileContents);
      
      const flattenObj = (obj, prefix = '') => {
        if (!obj) return;
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flattenObj(value, `${prefix}${key}.`);
          } else {
            //logger.info(`YAML: ${prefix}${key} = ${value}`);
          }
        }
      };
      flattenObj(this.config);
      logger.info('---------------------------------');

      this.normalizeConfigShape();
    } catch (error) {
      logger.error(`Failed to load configuration: ${error.message}`);
      throw error;
    }
  }

  normalizeConfigShape() {
    if (!this.config || typeof this.config !== 'object') {
      this.config = {};
    }

    this.config.ui = {
      baseUrl: this.config.uiUrl || (this.config.ui ? this.config.ui.baseUrl : undefined)
    };

    this.config.api = {
      baseUrl: this.config.apiUrl || (this.config.api ? this.config.api.baseUrl : undefined)
    };

    this.config.database = {
      host: this.config.dbHost || (this.config.database ? this.config.database.host : undefined),
      port: this.config.dbPort || (this.config.database ? this.config.database.port : undefined),
      username: this.config.dbUser || (this.config.database ? this.config.database.username : undefined),
      password: this.config.dbPassword || (this.config.database ? this.config.database.password : undefined),
      dbName: this.config.dbName || (this.config.database ? (this.config.database.dbName || this.config.database.name) : undefined),
      type: this.config.dbType || (this.config.database ? this.config.database.type : undefined)
    };

    const envExec = {};
    if (this.envVars) {
      for (const [key, rawValue] of Object.entries(this.envVars)) {
        let value = rawValue;
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value)) && value.trim() !== '') value = Number(value);

        envExec[key] = value;
        const camelKey = key.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        envExec[camelKey] = value;
      }
    }

    this.config.execution = {
      ...envExec,
      ...(this.config.execution || {})
    };
  }

  get(key) {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config[key];
  }

  getEnvironment() {
    return this.env;
  }

  getApplication() {
    return this.application;
  }

  getUiConfig() {
    return this.get('ui');
  }

  getApiConfig() {
    return this.get('api');
  }

  getDatabaseConfig() {
    return this.get('database');
  }

  getExecutionConfig() {
    return this.get('execution');
  }

}

// Export singleton instance
const configManagerInstance = new ConfigManager();
export default configManagerInstance;
export { ConfigManager };
