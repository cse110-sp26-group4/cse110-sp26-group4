# Baton CLI Commands Reference

This document provides a comprehensive reference for all commands available in the Baton CLI. 

---

## Table of Contents

- [Syntax Guide](#syntax-guide)
- [Global Options](#global-options)
- [Setup & Workflow Commands](#setup--workflow-commands)
  - [`baton init`](#baton-init)
  - [`baton register`](#baton-register)
  - [`baton status`](#baton-status)
  - [`baton next`](#baton-next)
  - [`baton loop`](#baton-loop)
- [Issue Management Commands](#issue-management-commands)
  - [`baton create`](#baton-create)
  - [`baton list`](#baton-list)
  - [`baton view`](#baton-view)
  - [`baton search`](#baton-search)
  - [`baton update`](#baton-update)
  - [`baton approve`](#baton-approve)
  - [`baton reject`](#baton-reject)
  - [`baton priority`](#baton-priority)
  - [`baton log`](#baton-log)
  - [`baton delete`](#baton-delete)
- [AI Agent Optimization](#ai-agent-optimization)

---

## Syntax Guide

The following conventions are used in the command syntax descriptions:

| Convention | Meaning | Example |
|---|---|---|
| `<argument>` | A required positional argument. | `baton view <id>` |
| `[<argument>]` | An optional positional argument. | — |
| `flag` | A required flag. | — |
| `[flag]` | An optional flag. | `baton init [--force]` |
| `flag <value>` | A required flag that requires a value. | `--name <name>` |
| `[flag <value>]` | An optional flag that requires a value if included. | `baton init [--steps <n>]` |
| `a \| b` | Mutually exclusive choices. | `agent \| human` |

---

## Global Options

The following flags are available on almost all commands:

| Flag | Description |
|---|---|
| `--json` | Output results in JSON format, optimized for AI agents and automation. |
| `--help`, `-h` | Show usage information and available flags for the command. |

---

## Setup & Workflow Commands

### `baton init`

Initializes the tracker in the current directory.

**Syntax:**
```bash
baton init [--force] [--specs <path>] [<specs-path>] [--json]
```

**Arguments**
| Argument | Description |
|---|---|
| `<specs-path>` | Positional alias for `--specs`. |

**Options:**
| Flag | Type | Default | Description |
|---|---|---|---|
| `--force` | boolean | `false` | Re-initialize an existing tracker. Clears all issues (activity log is preserved). |
| `--specs <path>` | string | `docs/specs/project-requirements.md` | Path to the specs markdown file. |

**Example:**
```bash
baton init --force
```
**Expected Output:**
```
Created 1 issue(s) from product specs.
Issues:
  #60 [Medium] FR-1.1
Run `baton status` to review progress or `baton next` to start work.
```

**Example (JSON):**
```bash
baton init --force --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "db_path": "C:\\Users\\jacky\\Documents\\School\\Spring Quarter 2026\\CSE 110\\cse110-sp26-group4\\data\\issues.db",
  "specs_path": "C:\\Users\\jacky\\Documents\\School\\Spring Quarter 2026\\CSE 110\\cse110-sp26-group4\\docs\\specs\\project-requirements.md",
  "count": 1,
  "issues": [
    {
      "id": 60,
      "title": "FR-1.1",
      "status": "open",
      "priority": "medium",
      "description": "The system shall allow a human supervisor to **create** a new issue via the CLI, providing at minimum a title, description, and priority level.",
      "token_limit": null,
      "attempt_num": 0,
      "created_at": "2026-06-04 03:17:05",
      "last_updated": "2026-06-04 03:17:05",
      "assignees": null
    }
  ]
}
```

---

### `baton register`

Registers a new AI agent or human user. This identity is used for audit logging.

**Syntax:**
```bash
baton register --name <name> [--type agent | human] [--json]
```

**Options:**
| Flag | Type | Default | Description |
|---|---|---|---|
| `--name <name>` | string | — | Unique identifier for the agent or user. |
| `--type <type>` | enum | `agent` | `agent | human`. |

**Example:**
```bash
baton register --name claude-dev --type agent
```

**Expected Output**
```bash
Successfully registered agent: "claude-dev" (ID: 4)
```

**Example (JSON):**
```bash
baton register --name claude-dev --type agent --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "agent": {
    "name": "claude-dev",
    "type": "agent",
    "id": 4
  }
}
```

---

### `baton status`

Displays issue counts by status and overall completion progress.

**Syntax:**
```bash
baton status [--json]
```

**Example:**
```bash
baton status
```

**Expected Output**
```bash
Issue Tracker Status
──────────────────────────────────────────
Total issues:     1
Open:             1
In progress:      0
In review:        0
Closed:           0
Overall progress: 0% complete

Open issues by priority:
  High:   0
  Medium: 1
  Low:    0
```

**Example (JSON):**
```bash
baton status --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "stats": {
    "total": 1,
    "open": 1,
    "in_progress": 0,
    "in_review": 0,
    "closed": 0,
    "progress_percent": 0
  },
  "open_by_priority": {
    "high": 0,
    "medium": 1,
    "low": 0
  }
}
```

---

### `baton next`

Selects the highest-priority open issue and marks it as `In-Progress`.

**Selection Order:** Priority (`high` → `medium` → `low`), then lowest ID.

**Syntax:**
```bash
baton next [--json]
```
**Example:**
```bash
baton next
```

**Expected Output:**
```bash
Working on next issue:
  ID:          #62
  Title:       FR-1.1
  Priority:    Medium
  Status:      In-Progress
  Attempts:    1
  Created:     04:27:08 2026-06-04
  Description: The system shall allow a human supervisor to **create** a new issue via the CLI, providing at minimum a title, description, and priority level.
```

**Example (JSON):**
```bash
baton next --json
```
**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 62,
    "title": "FR-1.1",
    "status": "in_progress",
    "priority": "medium",
    "description": "The system shall allow a human supervisor to **create** a new issue via the CLI, providing at minimum a title, description, and priority level.",
    "token_limit": null,
    "attempt_num": 2,
    "created_at": "2026-06-04 04:27:08",
    "last_updated": "2026-06-04 04:32:25",
    "assignees": null
  }
}
```

---

### `baton loop`

Runs `baton next` repeatedly for autonomous agent steps.

**Syntax:**
```bash
baton loop [--steps <n>] [-n <n>] [--json]
```

**Options:**
| Flag | Type | Default | Description |
|---|---|---|---|
| `--steps <n>` | integer | `1` | Number of autonomous steps to run. |
| `-n <n>` | integer | — | Alias for `--steps`. |

**Example:**
```bash
baton loop -n 2
```

**Expected Output:**
```bash
Running baton for 2 step(s)...

--- Step 1/2 ---
Working on next issue:
  ID:          #62
  Title:       FR-1.1
  Priority:    Medium
  Status:      In-Progress
  Attempts:    3
  Created:     04:27:08 2026-06-04
  Description: The system shall allow a human supervisor to **create** a new issue via the CLI, providing at minimum a title, description, and priority level.

--- Step 2/2 ---
No open issues available. All work is complete or the backlog is empty.

Completed 2 autonomous step(s).
```

**Example (JSON):**
```bash
baton loop -n 2 --json
```

**Expected Output (JSON):**
TODO

---

## Issue Management Commands

### `baton create`

Creates a new issue. Running without flags enters **Interactive Mode**.

**Syntax:**
```bash
baton create [--title <text>] [--description <text>] [--priority low | medium | high] [--token-limit <n>] [--json]
```

**Options:**
| Flag | Type | Default | Description |
|---|---|---|---|
| `--title <text>` | string | `Issue #<id>` | Short summary. |
| `--description <text>` | string | — | Full detailed description. |
| `--priority <level>` | enum | `low` | `low` (routine) \| `medium` (standard) \| `high` (critical). |
| `--token-limit <n>` | integer | — | Optional token budget for AI work. |

**Example:**
```bash
baton create --title "Fix login bug" --priority high
```

**Expected Output:**
```
Created issue #13: "Fix login bug"
```

**Example (JSON):**
```bash
baton create --title "Fix login bug" --priority high --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 13,
    "title": "Fix login bug",
    "status": "open",
    "priority": "high",
    "description": null,
    "token_limit": null,
    "attempt_num": 0,
    "created_at": "2026-06-04 04:36:03",
    "last_updated": "2026-06-04 04:36:03",
    "assignees": null
  }
}
```

---

### `baton list`

Lists issues matching optional filters.

**Syntax:**
```bash
baton list [--status open | in-progress | in-review | closed] [--priority low | medium | high] [--limit <n>] [--offset <n>] [--json]
```

**Options:**
| Flag | Type | Default | Description |
|---|---|---|---|
| `--status <s>` | enum | — | `open | in-progress | in-review | closed`. |
| `--priority <p>` | enum | — | `low | medium | high`. |
| `--limit <n>` | integer | `50` | Maximum results to return. |
| `--offset <n>` | integer | `0` | Results to skip for pagination. |

**Example:**
```bash
baton list --priority high --status open
``` 

**Expected Output:**
```
Found 2 issue(s) matching filters: [status: open, priority: high].

ID    │ TITLE                │ STATUS          │ PRIORITY   │ DESCRIPTION
──────┼──────────────────────┼─────────────────┼───────────────────────────────────────────────────────────────
13    │ Fix login bug        │ Open            │ high       │ N/A
```

**Example (JSON):**
```bash
baton list --priority high --status open --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "count": 1,
  "issues": [
    {
      "id": 13,
      "title": "Fix login bug",
      "status": "open",
      "priority": "high",
      "description": null,
      "token_limit": null,
      "attempt_num": 0,
      "created_at": "2026-06-04 04:37:12",
      "last_updated": "2026-06-04 04:37:12",
      "assignees": null
    }
  ]
}
```

---

### `baton view`

Displays all fields for a single issue.

**Syntax:**
```bash
baton view <id> [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | The ID of the issue to view. |

**Example:**
```bash
baton view 13
```

**Expected Output:**
```
title: Fix login bug
status: Open
priority: high
tokenLimit: null
description: null
lastUpdated: 2026-06-04 04:37:12
assigneeId: null
id: 13
createdAt: 2026-06-04 04:37:12
attemptNum: 0
```

**Example (JSON):**
```bash
baton view 13 --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 13,
    "title": "Fix login bug",
    "status": "open",
    "priority": "high",
    "description": null,
    "token_limit": null,
    "attempt_num": 0,
    "created_at": "2026-06-04 04:37:12",
    "last_updated": "2026-06-04 04:37:12",
    "assignees": null
  }
}
```

---

### `baton search`

Searches issue titles and descriptions (case-insensitive).

**Syntax:**
```bash
baton search <query> [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<query>` | The text to search for in issue titles and descriptions. |

**Example:**
```bash
baton search "login"
```

**Expected Output:**
```
Found 1 issue(s) containing "login":

ID    │ TITLE                │ STATUS          │ PRIORITY   │ DESCRIPTION
──────┼──────────────────────┼─────────────────┼────────────┼───────────────────────────────────────────────────
13    │ Fix login bug        │ Open            │ high       │ N/A
```

**Example (JSON):**
```bash
baton search "login" --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "count": 1,
  "issues": [
    {
      "id": 13,
      "title": "Fix login bug",
      "status": "open",
      "priority": "high",
      "description": null,
      "token_limit": null,
      "attempt_num": 0,
      "created_at": "2026-06-04 04:37:12",
      "last_updated": "2026-06-04 04:37:12",
      "assignees": null
    }
  ]
}
```

---

### `baton update`

Updates one or more fields on an existing issue. Running with only an ID enters **Interactive Mode**.

**Syntax:**
```bash
baton update <id> [--title <text>] [--description <text>] [--status open | in-progress | closed] [--priority low | medium | high] [--token-limit <n>] [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | The ID of the issue to update. |

**Options:**
| Flag | Type | Description |
|---|---|---|
| `--title <text>` | string | New title for the issue. |
| `--description <text>` | string | New description for the issue. |
| `--status <status>` | enum | New status: `open`, `in-progress`, or `closed`. |
| `--priority <level>` | enum | New priority: `low`, `medium`, or `high`. |
| `--token-limit <n>` | integer | New token budget for the issue. |

**Example:**
```bash
baton update 13 --status "in-progress" --priority "medium"
```

**Expected Output:**
```
Successfully updated issue #13:
  status: "Open" -> "In-Progress"
  priority: "high" -> "Medium"
```

**Example (JSON):**
```bash
baton update 13 --status "in-progress" --priority "medium" --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 13,
    "title": "Fix login bug",
    "status": "in_progress",
    "priority": "medium",
    "description": null,
    "token_limit": null,
    "attempt_num": 0,
    "created_at": "2026-06-04 04:37:12",
    "last_updated": "2026-06-04 05:11:06",
    "assignees": null
  }
}
```

---

### `baton approve`

Moves an issue from `In-Review` to `Closed`.

**Syntax:**
```bash
baton approve <id> [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | The ID of the issue to approve. |

**Example:**
```bash
baton approve 13
```

**Expected Output:**
```
Issue #13 approved and moved to Closed.
```

**Example (JSON):**
```bash
baton approve 13 --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 64,
    "title": "Fix login bug",
    "status": "closed",
    "priority": "medium",
    "description": null,
    "token_limit": null,
    "attempt_num": 0,
    "created_at": "2026-06-04 04:37:12",
    "last_updated": "2026-06-04 05:17:03",
    "assignees": null
  }
}
```

---

### `baton reject`

Returns an `In-Review` issue to `In-Progress` with a reason.

**Syntax:**
```bash
baton reject <id> --reason <text> [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | The ID of the issue to reject. |

**Options:**
| Flag | Type | Default | Description |
|---|---|---|---|
| `--reason <text>` | string | — | The reason for rejecting the issue. |

**Example:**
```bash
baton reject 13 --reason "Does not meet requirements."
```

**Expected Output:**
```
Issue #64 rejected successfully and moved back to "In-Progress".
```

**Example (JSON):**
```bash
baton reject 13 --reason "Does not meet requirements." --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 13,
    "title": "Fix login bug",
    "status": "in_progress",
    "priority": "medium",
    "description": null,
    "token_limit": null,
    "attempt_num": 0,
    "created_at": "2026-06-04 04:37:12",
    "last_updated": "2026-06-04 05:18:47",
    "assignees": null
  }
}
```

---

### `baton priority`

Quickly sets an issue's priority level.

**Syntax:**
```bash
baton priority <id> <level> [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | Issue ID. |
| `<level>` | `low` (routine) \| `medium` (standard) \| `high` (critical). |

**Example:**
```bash
baton priority 13 high
```

**Expected Output:**
```
Issue #13 priority set to High.
```

**Example (JSON):**
```bash
baton priority 13 high --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue": {
    "id": 64,
    "title": "Fix login bug",
    "status": "in_progress",
    "priority": "high",
    "description": null,
    "token_limit": null,
    "attempt_num": 0,
    "created_at": "2026-06-04 04:37:12",
    "last_updated": "2026-06-04 05:19:48",
    "assignees": null
  }
}
```

---

### `baton log`

Displays the full activity history for an issue.

**Syntax:**
```bash
baton log <id> [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | The ID of the issue to view the log for. |

**Example:**
```bash
baton log 13
```

**Expected Output:**
```
Activity log for issue #13
──────────────────────────────────────────
04:37:12 2026-06-04  creation  "Fix login bug" was created.
05:05:58 2026-06-04  read  Issue #64 was accessed.
05:06:28 2026-06-04  read  Issue #64 was accessed.
05:10:48 2026-06-04  read  Issue #64 was accessed.
05:10:48 2026-06-04  edit  Issue #64 was updated.
```

**Example (JSON):**
```bash
baton log 13 --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "issue_id": 13,
  "count": 38,
  "entries": [
    {
      "log_id": 99,
      "issue_id": 13,
      "action": "creation",
      "details": "\"Fix login bug\" was created.",
      "created_at": "2026-06-04 04:37:12"
    },
    {
      "log_id": 105,
      "issue_id": 13,
      "action": "read",
      "details": "Issue #13 was accessed.",
      "created_at": "2026-06-04 05:05:58"
    },
    {
      "log_id": 106,
      "issue_id": 13,
      "action": "read",
      "details": "Issue #13 was accessed.",
      "created_at": "2026-06-04 05:06:28"
    },
    {
      "log_id": 107,
      "issue_id": 13,
      "action": "read",
      "details": "Issue #13 was accessed.",
      "created_at": "2026-06-04 05:10:48"
    }
  ]
}
```

---

### `baton delete`

Permanently removes an issue.

**Syntax:**
```bash
baton delete <id> [--yes] [--json]
```

**Arguments:**
| Argument | Description |
|---|---|
| `<id>` | The ID of the issue to delete. |

**Options:**
| Flag | Type | Default | Description |
|---|---|
| `--yes` | boolean | `false` | Skip the confirmation prompt (required for JSON mode). |

**Example:**
```bash
baton delete 13 --yes
```

**Expected Output:**
```
Issue #13 deleted successfully.
```

**Example (JSON):**
```bash
baton delete 13 --yes --json
```

**Expected Output (JSON):**
```json
{
  "status": "success",
  "id": 13,
  "message": "Issue #13 deleted successfully."
}
```

---

## AI Agent Optimization

Most commands support the `--json` flag, which produces a consistent JSON envelope:

```json
{
  "status": "success" | "error",
  "message": "Human readable message (optional)",
  "issue": { ... }, // For commands returning a single issue
  "issues": [ ... ], // For list/search/init
  "stats": { ... }, // For status
  "error_code": "ENUM_CODE" // On failure
}
```

AI Agents should always use `--json` to reliably parse command results and handle errors programmatically.

Note that if AI agents use `--json`, it is not possible to respond to any confirmation prompts. Thus if any commands require confirmation prompts, they should be bypassed. For example, use

```bash
baton.cmd --delete 13 --json --yes
```

instead of

```bash
baton.cmd --delete 13 --json
```
