import { Given, When, Then } from '@cucumber/cucumber';
import axios from 'axios';
import mountebankServer from '../support/mountebank-server.js';

Given('user starts mountebank playback server for scenario {string}', async function (scenarioName) {
  const { imposterBaseUrl } = await mountebankServer.startFromEnv({ scenarioName });
  this.mountebankMode = mountebankServer.mode;
  this.mountebankBaseUrl = imposterBaseUrl;
  this.usesMountebankServer = true;
  this.persistMountebankRecording = mountebankServer.mode === 'record';
});

Given(
  'user starts mountebank record server for scenario {string} and target {string}',
  async function (scenarioName, targetBaseUrl) {
    const { imposterBaseUrl } = await mountebankServer.startFromEnv({ scenarioName, targetBaseUrl });
    this.mountebankMode = mountebankServer.mode;
    this.mountebankBaseUrl = imposterBaseUrl;
    this.usesMountebankServer = true;
    this.persistMountebankRecording = mountebankServer.mode === 'record';
  }
);

Given('user starts mountebank server for scenario {string}', async function (scenarioName) {
  const { imposterBaseUrl } = await mountebankServer.startFromEnv({ scenarioName });
  this.mountebankMode = mountebankServer.mode;
  this.mountebankBaseUrl = imposterBaseUrl;
  this.usesMountebankServer = true;
  this.persistMountebankRecording = mountebankServer.mode === 'record';
});

Given(
  'user starts mountebank server for scenario {string} and target {string}',
  async function (scenarioName, targetBaseUrl) {
    const { imposterBaseUrl } = await mountebankServer.startFromEnv({ scenarioName, targetBaseUrl });
    this.mountebankMode = mountebankServer.mode;
    this.mountebankBaseUrl = imposterBaseUrl;
    this.usesMountebankServer = true;
    this.persistMountebankRecording = mountebankServer.mode === 'record';
  }
);

When('user calls mountebank imposter endpoint {string}', async function (endpointPath) {
  const url = `${this.mountebankBaseUrl}${endpointPath}`;
  this.mountebankResponse = await axios.get(url, {
    validateStatus: () => true,
  });
});

Then('mountebank response status should be {int}', function (expectedStatus) {
  if (this.mountebankResponse?.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, but got ${this.mountebankResponse?.status}`);
  }
});

Then('mountebank response field {string} should be {string}', function (fieldName, expectedValue) {
  const actualValue = this.mountebankResponse?.data?.[fieldName];
  if (String(actualValue) !== expectedValue) {
    throw new Error(`Expected "${fieldName}" to be "${expectedValue}", but got "${actualValue}"`);
  }
});

Then('mountebank response field {string} should contain {string}', function (fieldName, expectedValue) {
  const actualValue = this.mountebankResponse?.data?.[fieldName];
  if (!String(actualValue).includes(expectedValue)) {
    throw new Error(`Expected "${fieldName}" to contain "${expectedValue}", but got "${actualValue}"`);
  }
});
