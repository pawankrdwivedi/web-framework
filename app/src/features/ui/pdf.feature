Feature: PDF Download and Validation

  @pdf
  Scenario: Validate PDF download and text content
    # Replace with steps that actually trigger a PDF download
    Given I navigate to the PDF download page
    When I click the download PDF button
    Then pdf file "sample.pdf" should be downloaded in Chrome Downloads path and should not be empty
    And downloaded pdf file should contain text "Expected Content"
