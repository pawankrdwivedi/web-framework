Feature: Demo App E2E Tests

  @ui @demo-app
  Scenario: User can login and view the dashboard
    When user navigates to the Demo App login page
    And user logs in with "admin" and "password"
    Then the user should see the dashboard with stats

  @ui @demo-app
  Scenario: User can view products
    When user navigates to the Demo App products page
    Then the user should see a list of products
