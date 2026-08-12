import { test, expect } from '@playwright/test';
import ApiClient from '../qe-framework-core/api/api-client.js';
import logger from '../qe-framework-core/logger/logger.js';

const API_BASE_URL = 'http://localhost:3001/api';

test.describe('API - Get Products', () => {
  let apiClient;

  test.beforeEach(async () => {
    apiClient = new ApiClient(API_BASE_URL);
    logger.info('API Client initialized for Products API testing');
  });

  test('GET /api/products - Should return all products with status 200', async () => {
    // Arrange
    logger.info('Test: Fetch all products');

    // Act
    const response = await apiClient.get('/products');
    const products = response.data;
    const status = response.status;

    // Assert
    expect(status).toBe(200);
    logger.info(`✓ Response status is 200`);

    expect(Array.isArray(products)).toBeTruthy();
    logger.info(`✓ Response is an array`);

    expect(products.length).toBeGreaterThan(0);
    logger.info(`✓ Products list contains ${products.length} items`);

    // Verify product structure
    products.forEach((product, index) => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('category');
      logger.debug(`✓ Product ${index + 1}: id=${product.id}, name=${product.name}, price=${product.price}, category=${product.category}`);
    });

    logger.info('✓ All products have required fields (id, name, price, category)');
  });

  test('GET /api/products?search=Headphones - Should return filtered products', async () => {
    // Arrange
    const searchQuery = 'Headphones';
    logger.info(`Test: Search for products containing "${searchQuery}"`);

    // Act
    const response = await apiClient.get(`/products?search=${searchQuery}`);
    const filteredProducts = response.data;
    const status = response.status;

    // Assert
    expect(status).toBe(200);
    logger.info(`✓ Response status is 200`);

    expect(Array.isArray(filteredProducts)).toBeTruthy();
    logger.info(`✓ Response is an array`);

    expect(filteredProducts.length).toBeGreaterThan(0);
    logger.info(`✓ Found ${filteredProducts.length} product(s) matching search query`);

    // Verify search results contain the search term
    filteredProducts.forEach((product) => {
      expect(product.name.toLowerCase()).toContain(searchQuery.toLowerCase());
      logger.info(`✓ Product "${product.name}" contains "${searchQuery}"`);
    });

    logger.info('✓ All filtered products match the search criteria');
  });

  test('GET /api/products/:id - Should return individual product details', async () => {
    // Arrange
    const productId = 1;
    logger.info(`Test: Fetch product details for ID ${productId}`);

    // Act
    const response = await apiClient.get(`/products/${productId}`);
    const product = response.data;
    const status = response.status;

    // Assert
    expect(status).toBe(200);
    logger.info(`✓ Response status is 200`);

    expect(product).toBeDefined();
    logger.info(`✓ Product data is not null or undefined`);

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('description');
    logger.info(`✓ Product has all required fields`);

    expect(product.id).toBe(productId.toString());
    logger.info(`✓ Product ID matches: ${product.id}`);

    logger.info(`✓ Product Details - Name: ${product.name}, Price: $${product.price}`);
  });

  test('GET /api/products - Verify response data types and values', async () => {
    // Arrange
    logger.info('Test: Validate product data types and values');

    // Act
    const response = await apiClient.get('/products');
    const products = response.data;

    // Assert
    expect(Array.isArray(products)).toBeTruthy();

    products.forEach((product) => {
      // Verify data types
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(typeof product.price).toBe('number');
      expect(typeof product.category).toBe('string');

      // Verify data validity
      expect(product.id).toBeGreaterThan(0);
      expect(product.name.length).toBeGreaterThan(0);
      expect(product.price).toBeGreaterThan(0);
      expect(['Electronics', 'Sports', 'Home', 'Apparel']).toContain(product.category);

      logger.debug(`✓ Product validation passed - ${product.name}`);
    });

    logger.info('✓ All products have valid data types and values');
  });
});
