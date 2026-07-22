Feature: Montebank server demo

  @component @ui
  Scenario: Use qe-framework-core mountebank server in playback mode
    Given user starts montebank playback server for scenario "montebank_server_demo"
    When user calls montebank imposter endpoint "/sample/accounts/1001"
    Then montebank response status should be 200
    And montebank response field "accountId" should be "1001"

  @component @ui
  Scenario: Use qe-framework-core mountebank server in record mode
    Given user starts montebank record server for scenario "montebank_server_record_demo" and target "https://postman-echo.com"
    When user calls montebank imposter endpoint "/get?sampleRecord=true"
    Then montebank response status should be 200
    And montebank response field "url" should contain "postman-echo.com/get"
