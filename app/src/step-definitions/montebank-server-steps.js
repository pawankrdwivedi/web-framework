import { Given, When, Then } from '@cucumber/cucumber';
import axios from 'axios';
import montebankServer from '../support/montebank-server.js';

Given('user starts montebank playback server for scenario {string}', async function (scenarioName) {
  const { imposterBaseUrl } = await montebankServer.startFromEnv({ scenarioName });
  this.montebankMode = montebankServer.mode;
  this.montebankBaseUrl = imposterBaseUrl;
  this.usesMontebankServer = true;
  this.persistMontebankRecording = montebankServer.mode === 'record';
});

Given(
  'user starts montebank record server for scenario {string} and target {string}',
  async function (scenarioName, targetBaseUrl) {
    const { imposterBaseUrl } = await montebankServer.startFromEnv({ scenarioName, targetBaseUrl });
    this.montebankMode = montebankServer.mode;
    this.montebankBaseUrl = imposterBaseUrl;
    this.usesMontebankServer = true;
    this.persistMontebankRecording = montebankServer.mode === 'record';
  }
);

Given('user starts montebank server for scenario {string}', async function (scenarioName) {
  const { imposterBaseUrl } = await montebankServer.startFromEnv({ scenarioName });
  this.montebankMode = montebankServer.mode;
  this.montebankBaseUrl = imposterBaseUrl;
  this.usesMontebankServer = true;
  this.persistMontebankRecording = montebankServer.mode === 'record';
});

Given(
  'user starts montebank server for scenario {string} and target {string}',
  async function (scenarioName, targetBaseUrl) {
    const { imposterBaseUrl } = await montebankServer.startFromEnv({ scenarioName, targetBaseUrl });
    this.montebankMode = montebankServer.mode;
    this.montebankBaseUrl = imposterBaseUrl;
    this.usesMontebankServer = true;
    this.persistMontebankRecording = montebankServer.mode === 'record';
  }
);

When('user calls montebank imposter endpoint {string}', async function (endpointPath) {
  const url = `${this.montebankBaseUrl}${endpointPath}`;
  this.montebankResponse = await axios.get(url, {
    validateStatus: () => true,
  });
});

Then('montebank response status should be {int}', function (expectedStatus) {
  if (this.montebankResponse?.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, but got ${this.montebankResponse?.status}`);
  }
});

Then('montebank response field {string} should be {string}', function (fieldName, expectedValue) {
  const actualValue = this.montebankResponse?.data?.[fieldName];
  if (String(actualValue) !== expectedValue) {
    throw new Error(`Expected "${fieldName}" to be "${expectedValue}", but got "${actualValue}"`);
  }
});

Then('montebank response field {string} should contain {string}', function (fieldName, expectedValue) {
  const actualValue = this.montebankResponse?.data?.[fieldName];
  if (!String(actualValue).includes(expectedValue)) {
    throw new Error(`Expected "${fieldName}" to contain "${expectedValue}", but got "${actualValue}"`);
  }
});
