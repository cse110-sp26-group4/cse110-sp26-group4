# CLI Design Mockup

The issue tracker is a command-line tool named `issue`. It provides a comprehensive interface for humans and AI agents to manage tickets.

## General Command Structure
`issue [command] [subcommand] [flags]`

## Core Commands

### 1. Issue Management (CRUD)
*   `issue create`: Create a new issue.
    *   `--title "..."`
    *   `--priority [low|medium|high]`
    *   `--description "..."`
    *   `--token-limit [int]`
*   `issue list`: List all issues.
    *   `--status [open|closed]`
    *   `--priority [low|medium|high]`
    *   `--json`: Output in JSON format (useful for AI agents).
*   `issue view <id>`: View details of a specific issue.
    *   Shows metadata, description, and full activity history.
*   `issue edit <id>`: Modify an existing issue.
*   `issue delete <id>`: Delete an issue (requires confirmation).
*   `issue close <id>`: Shortcut to set status to 'Closed'.

### 2. AI Agent Interaction
*   `issue agent register`: Register a new agent in the system.
*   `issue agent list`: List all registered agents and their status.
*   `issue agent retire <agent_id>`: Deactivate an agent (e.g., for bad performance).
*   `issue agent work <id>`: Command for an agent to "take" a ticket.
    *   `--reasoning "..."`: Required flag for agents to log their thought process.
*   `issue approve <id>`: Human command to approve changes proposed by an agent.
*   `issue pause <id>`: Pause an agent's work on a ticket.
*   `issue resume <id>`: Resume work on a paused ticket.

### 3. Communication & Intelligence
*   `issue chat`: Opens an interactive shell for "General Chat" where humans can type ideas and AI deconstructs them into tickets.
*   `issue summary <id>`: Generate an AI summary of a large ticket's history.

### 4. Monitoring & Analytics
*   `issue dashboard`: Launch the TUI (Text User Interface) dashboard.
*   `issue logs <id>`: View detailed reasoning logs and activity history for a ticket.
*   `issue tokens`: View token usage stats per agent and per ticket.

## Example Interactions

### Human Creating an Issue
```bash
$ issue create --title "Fix login bug" --priority high --description "Users are unable to login with OAuth."
Issue #101 created successfully.
```

### AI Agent Listing Tickets (JSON Output)
```bash
$ issue list --status open --json
[
  {
    "id": 101,
    "title": "Fix login bug",
    "priority": "high",
    "status": "open",
    "token_limit": 5000,
    "created_at": "14:20:00 2026-05-17"
  }
]
```

### AI Agent Proposing a Fix
```bash
$ issue agent work 101 --reasoning "I identified that the OAuth callback URL is mismatched in the config. I will update the .env template."
Change proposed for Issue #101. Awaiting human approval.
```

### Human Approving the Change
```bash
$ issue approve 101
Change approved for Issue #101. Activity logged.
```
