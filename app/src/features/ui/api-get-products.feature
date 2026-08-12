Feature: API - Get Products
  Scenario: User retrieves all products from the store
    Given the API client is initialized
    When user performs a GET request to fetch all products
    Then the API response status should be 200
    And the response should contain a list of products
    And each product should have id, name, price, and category fields

  Scenario: User searches for products with a search query
    Given the API client is initialized
    When user performs a GET request to search for "Headphones"
    Then the API response status should be 200
    And the response should contain filtered products
    And the product name should contain "Headphones"
