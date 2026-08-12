import { Given, When, Then } from '../support/world.js';
import ApiClient from '../../qe-framework-core/api/api-client.js';
import logger from '../../qe-framework-core/logger/logger.js';

let apiClient;
let apiResponse;
let responseStatus;
let apiError;

Given('the API client is initialized', () => {
  apiClient = new ApiClient('http://localhost:3001/api');
  logger.info('API Client initialized with base URL: http://localhost:3001/api');
});

When('user performs a POST request to login with username {string} and password {string}', async (username, password) => {
  try {
    const loginPayload = { username, password };
    const response = await apiClient.post('/login', loginPayload);
    apiResponse = response.data;
    responseStatus = response.status;
    apiError = null;
    logger.info(`POST /login - Status: ${responseStatus}`);
    logger.debug(`Response: ${JSON.stringify(apiResponse, null, 2)}`);
  } catch (error) {
    responseStatus = error.status || 500;
    apiError = error;
    try {
      apiResponse = error.data;
    } catch {
      apiResponse = { error: error.message };
    }
    logger.warn(`Login failed - Status: ${responseStatus}, Error: ${error.message}`);
  }
});

Then('the API response status should be {int}', (expectedStatus) => {
  if (responseStatus !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, but got ${responseStatus}`);
  }
  logger.info(`✓ Response status is ${expectedStatus} as expected`);
});

Then('the response should contain a token', () => {
  if (!apiResponse || !apiResponse.token) {
    throw new Error('Response does not contain a token field');
  }
  logger.info(`✓ Response contains token: ${apiResponse.token.substring(0, 20)}...`);
});

Then('the response should contain userId field', () => {
  if (!apiResponse || !apiResponse.userId) {
    throw new Error('Response does not contain userId field');
  }
  logger.info(`✓ Response contains userId: ${apiResponse.userId}`);
});

Then('the token value should start with {string}', (tokenPrefix) => {
  if (!apiResponse.token.startsWith(tokenPrefix)) {
    throw new Error(`Token "${apiResponse.token}" does not start with "${tokenPrefix}"`);
  }
  logger.info(`✓ Token starts with "${tokenPrefix}"`);
});

Then('the response should contain an error message', () => {
  if (!apiResponse || !apiResponse.error) {
    throw new Error('Response does not contain an error message');
  }
  logger.info(`✓ Response contains error message: ${apiResponse.error}`);
});

Then('the error message should be {string}', (expectedError) => {
  if (!apiResponse || apiResponse.error !== expectedError) {
    throw new Error(`Expected error "${expectedError}", but got "${apiResponse?.error || 'no error'}"`);
  }
  logger.info(`✓ Error message is "${expectedError}" as expected`);
});
