x import { test, expect } from '@playwright/test';
import ApiClient from '../qe-framework-core/api/api-client.js';
import logger from '../qe-framework-core/logger/logger.js';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('API - User Login', () => {
  let apiClient;

  test.beforeEach(async () => {
    apiClient = new ApiClient(API_BASE_URL);
    logger.info('API Client initialized for Login API testing');
  });

  test('POST /api/login - Should login successfully with valid credentials', async () => {
    // Arrange
    const loginCredentials = {
      username: 'admin',
      password: 'password'
    };
    logger.info(`Test: Login with username="${loginCredentials.username}"`);

    // Act
    const response = await apiClient.post('/login', loginCredentials);
    const loginResponse = response.data;
    const status = response.status;

    // Assert
    expect(status).toBe(200);
    logger.info(`✓ Response status is 200`);

    expect(loginResponse).toBeDefined();
    logger.info(`✓ Response data is not null or undefined`);

    expect(loginResponse).toHaveProperty('token');
    expect(loginResponse).toHaveProperty('userId');
    logger.info(`✓ Response contains both 'token' and 'userId' fields`);

    expect(typeof loginResponse.token).toBe('string');
    expect(loginResponse.token.length).toBeGreaterThan(0);
    logger.info(`✓ Token is a non-empty string: ${loginResponse.token.substring(0, 20)}...`);

    expect(typeof loginResponse.userId).toBe('number');
    expect(loginResponse.userId).toBeGreaterThan(0);
    logger.info(`✓ UserId is a valid number: ${loginResponse.userId}`);

    expect(loginResponse.token).toMatch(/^mock-jwt-token/);
    logger.info(`✓ Token format is valid (starts with 'mock-jwt-token')`);

    logger.info('✓ Login successful - User authenticated');
  });

  test('POST /api/login - Should fail with invalid credentials', async () => {
    // Arrange
    const invalidCredentials = {
      username: 'invalid_user',
      password: 'wrong_password'
    };
    logger.info(`Test: Login attempt with invalid credentials`);

    // Act & Assert
    try {
      const response = await apiClient.post('/login', invalidCredentials);
      // If we reach here, the request was successful but shouldn't be
      throw new Error(`Expected API to return error status, but got 200`);
    } catch (error) {
      // Verify it's an authentication error
      expect(error.status).toBe(401);
      logger.info(`✓ Response status is 401 (Unauthorized)`);

      const errorResponse = error.data;
      expect(errorResponse).toHaveProperty('error');
      logger.info(`✓ Response contains 'error' field`);

      expect(errorResponse.error).toBe('Invalid credentials');
      logger.info(`✓ Error message is correct: "${errorResponse.error}"`);

      logger.info('✓ Login failed as expected with invalid credentials');
    }
  });

  test('POST /api/login - Should verify token value contains expected prefix', async () => {
    // Arrange
    const validCredentials = {
      username: 'admin',
      password: 'password'
    };
    const expectedTokenPrefix = 'mock-jwt-token';
    logger.info(`Test: Verify token format and content`);

    // Act
    const response = await apiClient.post('/login', validCredentials);
    const loginResponse = response.data;

    // Assert
    expect(loginResponse.token).toStartWith(expectedTokenPrefix);
    logger.info(`✓ Token starts with expected prefix: "${expectedTokenPrefix}"`);

    expect(loginResponse.token.includes('-')).toBeTruthy();
    logger.info(`✓ Token contains hyphen as separator`);

    expect(loginResponse.token.length).toBeGreaterThan(expectedTokenPrefix.length);
    logger.info(`✓ Token is longer than prefix (additional payload present)`);

    logger.info('✓ Token validation passed');
  });

  test('POST /api/login - Should verify userId in response is consistent', async () => {
    // Arrange
    const loginCredentials = {
      username: 'admin',
      password: 'password'
    };
    const expectedUserId = 1;
    logger.info(`Test: Verify userId is consistent and correct`);

    // Act
    const response = await apiClient.post('/login', loginCredentials);
    const loginResponse = response.data;

    // Assert
    expect(loginResponse.userId).toBe(expectedUserId);
    logger.info(`✓ UserId matches expected value: ${expectedUserId}`);

    expect(Number.isInteger(loginResponse.userId)).toBeTruthy();
    logger.info(`✓ UserId is an integer`);

    expect(loginResponse.userId).toBeGreaterThan(0);
    logger.info(`✓ UserId is positive`);

    logger.info('✓ UserId validation passed');
  });

  test('POST /api/login - Should have proper response content type', async () => {
    // Arrange
    const loginCredentials = {
      username: 'admin',
      password: 'password'
    };
    logger.info(`Test: Verify response content type and headers`);

    // Act
    const response = await apiClient.post('/login', loginCredentials);

    // Assert
    expect(response.status).toBe(200);
    const contentType = response.headers['content-type'];
    expect(contentType).toContain('application/json');
    logger.info(`✓ Response Content-Type is application/json`);

    expect(response.data).toBeDefined();
    logger.info(`✓ Response body is valid JSON`);

    logger.info('✓ Response headers validation passed');
  });

  test('POST /api/login - Should not expose sensitive data in error response', async () => {
    // Arrange
    const invalidCredentials = {
      username: 'admin',
      password: 'wrong_password'
    };
    logger.info(`Test: Verify sensitive data is not exposed in error response`);

    // Act & Assert
    try {
      await apiClient.post('/login', invalidCredentials);
    } catch (error) {
      const errorResponse = error.data;

      // Verify error response doesn't contain sensitive data
      expect(JSON.stringify(errorResponse)).not.toContain('password');
      logger.info(`✓ Error response does not contain password`);

      expect(JSON.stringify(errorResponse)).not.toContain('token');
      logger.info(`✓ Error response does not contain token`);

      expect(errorResponse.error).toBe('Invalid credentials');
      logger.info(`✓ Error message is generic and user-friendly`);

      logger.info('✓ Sensitive data protection validation passed');
    }
  });
});
