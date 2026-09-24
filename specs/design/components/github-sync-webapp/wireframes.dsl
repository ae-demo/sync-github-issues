screen Dashboard "Overview of the sync's current setup"
  navbar "Issue Sync"
  sidebar "Dashboard -> Dashboard | Repositories -> Repositories | Chat Destination -> ChatDestination | Notification Log -> NotificationLog"
  row
    card "GitHub connection | Not connected | authorize access to your repositories"
    card "Chat destination | Not set | where notifications are posted"
  button "Connect GitHub" primary -> ConnectGithub
  heading "Recent notifications"
  table "Repository | Issue | Sent at"
    row "acme/widgets | Payment webhook failing | 2 minutes ago"
    row "acme/widgets | Checkout returns 500 | 1 hour ago"
  link "View full notification log" -> NotificationLog

screen ConnectGithub "Authorize the product to read the Administrator's repositories"
  navbar "Issue Sync"
  sidebar "Dashboard -> Dashboard | Repositories -> Repositories | Chat Destination -> ChatDestination | Notification Log -> NotificationLog"
  card "Connect your GitHub account"
    text "You will be redirected to GitHub to authorize read access to your repositories."
    button "Continue with GitHub" primary // redirects to GitHub's OAuth page, returns to Dashboard connected

screen Repositories "The repositories currently being watched for critical issues"
  navbar "Issue Sync"
  sidebar "Dashboard -> Dashboard | Repositories -> Repositories | Chat Destination -> ChatDestination | Notification Log -> NotificationLog"
  row
    heading "Watched repositories"
    right
    button "Add repository" primary -> AddRepository
  table "Repository | Added" -> AddRepository
    row "acme/widgets | 3 days ago"
    row "acme/billing | 1 day ago"

screen AddRepository "Add a repository to the watch list"
  navbar "Issue Sync"
  sidebar "Dashboard -> Dashboard | Repositories -> Repositories | Chat Destination -> ChatDestination | Notification Log -> NotificationLog"
  card "Add repository"
    input "Owner (e.g. acme)"
    input "Repository name (e.g. widgets)"
    row
      right
      button "Cancel" -> Repositories
      button "Add" primary -> Repositories

screen ChatDestination "The Google Chat space notifications are posted to"
  navbar "Issue Sync"
  sidebar "Dashboard -> Dashboard | Repositories -> Repositories | Chat Destination -> ChatDestination | Notification Log -> NotificationLog"
  card "Chat destination"
    input "Space name (e.g. Engineering Alerts)"
    input "Webhook URL"
    button "Save" primary // saves in place, destination stays on this screen

screen NotificationLog "Every critical-issue notification sent so far"
  navbar "Issue Sync"
  sidebar "Dashboard -> Dashboard | Repositories -> Repositories | Chat Destination -> ChatDestination | Notification Log -> NotificationLog"
  heading "Notification log"
  table "Repository | Issue | Sent at | Status"
    row "acme/widgets | Payment webhook failing | 2 minutes ago | Sent"
    row "acme/widgets | Checkout returns 500 | 1 hour ago | Sent"
    row "acme/billing | Invoice generation crashing | 1 day ago | Failed"

flow "Set up and monitor the sync"
  role "Administrator"
  description "The Administrator connects GitHub, manages watched repositories, sets the Chat destination, and checks the notification log"
  Dashboard
  ConnectGithub
  Repositories
  AddRepository
  ChatDestination
  NotificationLog
