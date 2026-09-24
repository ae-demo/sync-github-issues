# sync-github-issues — PRD

## Problem Statement

Teams track their most urgent work as GitHub issues labeled "critical", but GitHub is not where the team actually talks — that happens in Google Chat. Today, someone has to remember to check GitHub for new critical issues and manually paste them into chat, so urgent issues sit unseen until a person happens to notice them.

## Solution

An integration that watches a configurable set of GitHub repositories for issues labeled "critical" and automatically posts a notification into a Google Chat space the moment such an issue appears, so the team sees urgent work the instant it is filed, without anyone relaying it by hand.

## Actors

- **Administrator** — signs in to the product, manages the list of GitHub repositories being watched, configures the destination Google Chat space, and can review recent sync activity.
- **Team Member** — does not sign in to the product; receives and reads the critical-issue notifications posted into the team's Google Chat space.

## User Stories

1. As an Administrator, I want to sign in securely, so that only authorized people can change what is monitored and where notifications go.
2. As an Administrator, I want to add a GitHub repository to the watch list, so that its critical issues start being synced.
3. As an Administrator, I want to remove a repository from the watch list, so that it stops being monitored.
4. As an Administrator, I want to view the list of repositories currently being watched, so that I can confirm the current setup at a glance.
5. As an Administrator, I want to configure the destination Google Chat space that notifications are posted to, so that the right team sees them.
6. As an Administrator, I want to see a log of recent notifications the system has sent, so that I can confirm delivery is working.
7. As a Team Member, I want each critical-issue notification in Google Chat to show the issue's title, repository, and a link back to GitHub, so that I can open and act on it immediately.
8. As an Administrator, I want the system to never send more than one notification for the same critical issue, so that the chat space isn't spammed with duplicates.

## Product Decisions

- Sign-in: Administrators authenticate via SSO through Thunder, the platform IDP (org default).
- Source system: GitHub Issues is the given source of critical issues, per the product brief.
- Destination: Google Chat is the given notification channel, per the product brief.
- Watch scope: Administrators maintain a configurable list of specific repositories to watch, rather than a single fixed repo or an entire org (Product Decision, from interview).
- Trigger: a notification fires only when a new issue is opened already carrying the "critical" label; a label added later to an existing issue does not trigger a notification in this version (Product Decision, from interview).
- Configuration surface: repo list and Google Chat destination are managed through an admin screen inside the product, not a one-time deployment config (Product Decision, from interview).
- Detection mechanism: the system polls GitHub periodically for new critical issues on watched repositories, rather than relying on GitHub webhooks *assumed*.
- Poll frequency: every 5 minutes *assumed*.
- Notification content: each Google Chat message includes the issue title, repository name, and a direct link to the GitHub issue *assumed*.
- GitHub access: the Administrator supplies a GitHub access token with read access to the watched repositories during setup *assumed*.

## Out of Scope

- Two-way sync — this product never creates, edits, comments on, or closes GitHub issues.
- Syncing labels other than "critical", or non-issue GitHub events (pull requests, discussions, releases).
- Notifying on lifecycle changes of an already-synced issue (close, reopen, unlabel) in this version.
- Support for chat platforms other than Google Chat.
- Per-person notification preferences or direct messages — notifications only go to the configured Chat space.

## Open Questions

1. Does the Administrator already hold a GitHub access token (personal access token or GitHub App installation) to supply during setup, or does the product need to walk them through creating one?

## Further Notes

None.

