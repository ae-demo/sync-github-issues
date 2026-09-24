Feature: Repository watch list

  @story-1
  Rule: Only a signed-in Administrator may view or change the sync configuration

    @negative
    Scenario: A visitor who is not signed in cannot reach the watch list
      Given Priya is not signed in
      When Priya tries to open the repository watch list
      Then she is not shown the watch list

    Scenario: A signed-in Administrator reaches the watch list
      Given Priya is signed in as an Administrator
      When Priya opens the repository watch list
      Then she sees the watch list screen

  @story-2
  Rule: An Administrator can add a repository to the watch list

    Scenario: Adding a new repository
      Given Priya is signed in as an Administrator
      And "acme/widgets" is not on the watch list
      When Priya adds "acme/widgets" to the watch list
      Then "acme/widgets" appears on the watch list

    @negative
    Scenario: Adding a repository already being watched is refused
      Given Priya is signed in as an Administrator
      And "acme/widgets" is already on the watch list
      When Priya tries to add "acme/widgets" to the watch list again
      Then the watch list still has exactly one entry for "acme/widgets"

  @story-3
  Rule: An Administrator can remove a repository from the watch list

    Scenario: Removing a watched repository
      Given Priya is signed in as an Administrator
      And "acme/billing" is on the watch list
      When Priya removes "acme/billing" from the watch list
      Then "acme/billing" no longer appears on the watch list

  @story-4
  Rule: An Administrator can view every currently watched repository

    Scenario: Viewing the current watch list
      Given Priya is signed in as an Administrator
      And "acme/widgets" and "acme/billing" are both on the watch list
      When Priya opens the repository watch list
      Then she sees both "acme/widgets" and "acme/billing" listed

  @story-5
  Rule: An Administrator can configure the destination Google Chat space

    Scenario: Setting the Chat destination
      Given Priya is signed in as an Administrator
      When Priya sets the Chat destination to space "Engineering Alerts" with a valid webhook URL
      Then the configured destination is "Engineering Alerts"

    @negative
    Scenario: An invalid webhook URL is refused
      Given Priya is signed in as an Administrator
      When Priya tries to set the Chat destination with the webhook value "not-a-url"
      Then the Chat destination is unchanged

  @story-9
  Rule: An Administrator connects GitHub through an OAuth authorization step, never by pasting a token

    Scenario: Connecting a GitHub account
      Given Priya is signed in as an Administrator
      And her GitHub account is not yet connected
      When Priya completes the GitHub authorization step
      Then her GitHub connection is shown as connected

    @negative
    Scenario: No token field is offered
      Given Priya is signed in as an Administrator
      When Priya opens the GitHub connection screen
      Then she is offered an authorization button and no field for entering a token
