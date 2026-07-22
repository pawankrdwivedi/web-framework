Feature: Google Search Demo

  @ui @google-demo
  Scenario: Search a query in Google Search and validate the result
    When user navigates to Google Search page
    And user searches for query "Cucumber Framework"
    Then search result page should be displayed with results for "Cucumber Framework"
