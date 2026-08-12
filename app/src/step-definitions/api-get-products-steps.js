import { Given, When, Then } from '../support/world.js';
import ApiClient from '../../qe-framework-core/api/api-client.js';
import logger from '../../qe-framework-core/logger/logger.js';

let apiClient;
let apiResponse;
let responseStatus;

Given('the API client is initialized', () => {
  apiClient = new ApiClient('http://localhost:3001/api');
  logger.info('API Client initialized with base URL: http://localhost:3001/api');
});

When('user performs a GET request to fetch all products', async () => {
  try {
    const response = await apiClient.get('/products');
    apiResponse = response.data;
    responseStatus = response.status;
    logger.info(`GET /products - Status: ${responseStatus}`);
    logger.debug(`Response: ${JSON.stringify(apiResponse, null, 2)}`);
  } catch (error) {
    logger.error(`Failed to fetch products: ${error.message}`);
    throw error;
  }
});

When('user performs a GET request to search for {string}', async (searchQuery) => {
  try {
    const response = await apiClient.get(`/products?search=${searchQuery}`);
    apiResponse = response.data;
    responseStatus = response.status;
    logger.info(`GET /products?search=${searchQuery} - Status: ${responseStatus}`);
    logger.debug(`Response: ${JSON.stringify(apiResponse, null, 2)}`);
  } catch (error) {
    logger.error(`Failed to search products: ${error.message}`);
    throw error;
  }
});

Then('the API response status should be {int}', (expectedStatus) => {
  if (responseStatus !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, but got ${responseStatus}`);
  }
  logger.info(`✓ Response status is ${expectedStatus} as expected`);
});

Then('the response should contain a list of products', () => {
  if (!Array.isArray(apiResponse)) {
    throw new Error('Response is not an array of products');
  }
  if (apiResponse.length === 0) {
    throw new Error('Product list is empty');
  }
  logger.info(`✓ Response contains ${apiResponse.length} products`);
});

Then('each product should have id, name, price, and category fields', () => {
  apiResponse.forEach((product, index) => {
    if (!product.id || !product.name || !product.price || !product.category) {
      throw new Error(`Product at index ${index} is missing required fields. Got: ${JSON.stringify(product)}`);
    }
  });
  logger.info('✓ All products have required fields (id, name, price, category)');
});

Then('the response should contain filtered products', () => {
  if (!Array.isArray(apiResponse)) {
    throw new Error('Response is not an array');
  }
  logger.info(`✓ Response contains ${apiResponse.length} filtered product(s)`);
});

Then('the product name should contain {string}', (searchTerm) => {
  const foundProduct = apiResponse.some(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (!foundProduct) {
    throw new Error(`No product found containing "${searchTerm}"`);
  }
  logger.info(`✓ Found product(s) containing "${searchTerm}"`);
});
