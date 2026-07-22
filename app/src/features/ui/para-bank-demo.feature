Feature: Para Bank Transactions Demo

  @para-bank-demo
  Scenario: Add Bill Payment Transaction
    When user navigates to Para Bank Home Page
    And user login to the application
    Then click to Account Services Link "Bill Pay"
    When user fills Bill Payment Service form with data
      | payeeName           | John Doe        |
      | address             | 123 Main Street |
      | city                | Charlotte       |
      | state               | NC              |
      | zipCode             | 28202           |
      | phoneNumber         | 7045551234      |
      | accountNumber       | 12345678        |
      | verifyAccountNumber | 12345678        |
      | amount              | 250             |
      | fromAccount         | 13344           |

    When user fills Bill Payment Service form with data
      | payeeName           | Jane Smith      |
      | address             | 456 Oak Avenue  |
      | city                | Raleigh         |
      | state               | NC              |
      | zipCode             | 27601           |
      | phoneNumber         | 9195550000      |
      | accountNumber       | 87654321        |
      | verifyAccountNumber | 87654321        |
      | amount              | 125             |
      | fromAccount         | 24455           |
