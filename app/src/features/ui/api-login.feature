Feature: API - User Login
  Scenario: User logs in with valid credentials
    Given the API client is initialized
    When user performs a POST request to login with username "admin" and password "password"
    Then the API response status should be 200
    And the response should contain a token
    And the response should contain userId field
    And the token value should start with "mock-jwt-token"

  Scenario: User login fails with invalid credentials
    Given the API client is initialized
    When user performs a POST request to login with username "invalid" and password "wrongpass"
    Then the API response status should be 401
    And the response should contain an error message
    And the error message should be "Invalid credentials"
