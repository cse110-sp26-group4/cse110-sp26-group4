# Command-Line Interface (CLI)

The CLI is the primary interface for developers to interact with the issue tracking system.

## General Commands

*   `issue-tracker login`: Authenticate with the system.
*   `issue-tracker ainit`: Configure the project for the issue tracker (creates `.issue-tracker/config.yml`).
*   `issue-tracker chat "[prompt]"`: Start a chat session with the general AI assistant.

## Issue Commands

*   `issue-tracker list`: List all issues.
    *   `--assignee <id>`: Filter by assignee.
    *   `--status <status>`: Filter by status.
    *   `--mine`: Show issues assigned to you.
*   `issue-tracker show <issue_id>`: Show details of a specific issue.
*   `issue-tracker create`: Create a new issue (will open a text editor).
    *   `--title "..."`
    *   `--description "..."`
*   `issue-tracker comment <issue_id> "[comment]"`: Add a comment to an issue.
*   `issue-tracker log <issue_id>`: View the activity log for an issue.

## AI Interaction Commands

*   `issue-tracker assign <issue_id> <agent_id>`: Assign an issue to an AI agent.
*   `issue-tracker pause <issue_id>`: Pause the AI working on an issue.
*   `issue-tracker cancel <issue_id>`: Cancel the AI's work and revert any in-progress changes.

## Review Commands

*   `issue-tracker review list`: List all issues awaiting review.
*   `issue-tracker review show <issue_id>`: Show the proposed change for an issue.
*   `issue-tracker review approve <issue_id>`: Approve the change.
*   `issue-tracker review reject <issue_id>`: Reject the change (will prompt for a reason).
