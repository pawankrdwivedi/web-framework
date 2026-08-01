Feature: Goole Search Functionality

@ui @google-search
Scenario Outline: User can perform a Google search
Given user navigates to Google Search page
And user searches for "<query>"
Then search result page should be displayed with results for "<query>"

Examples:
  | query       |
  | Playwright  |
  | Cucumber    |
