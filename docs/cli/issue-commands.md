# Issue Commands

Commands for creating, viewing, searching, updating, and approving issues. All commands require an initialized tracker unless noted otherwise.

Issue IDs are plain integers (e.g. `3`, `29`).

See [README](README.md) for the full data model, status values, and exit codes.

---

## `baton create`

```
baton create [--title <text>] [--description <text>] [--priority <level>] [--token-limit <n>]
```

Creates a new issue. All flags are optional; if `--title` is omitted, a SQL trigger sets the title to `Issue #<id>` after insert.

### Options

| Flag | Type | Required | Default | Description |
|---|---|---|---|---|
| `--title <text>` | string | no | `Issue #<id>` | Short summary |
| `--description <text>` | string | no | — | Full description |
| `--priority <level>` | enum | no | `low` | `low` · `medium` · `high` |
| `--token-limit <n>` | integer > 0 | no | — | Token budget for agent work on this issue |

### Behavior

- Sets initial status to `Open`.
- Writes a `creation` entry to the activity log.

### Example

```bash
baton create --title "Fix login bug" --priority high
baton create --title "Refactor auth" --description "Clean up JWT logic" --token-limit 4000
```

```
Successfully created issue #5: "Fix login bug"
```

---

## `baton list`

```
baton list [--status <s>] [--priority <p>] [--limit <n>] [--offset <n>]
```

Lists issues matching optional filters.

### Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--status <s>` | enum | — | Filter by status: `open` · `in-progress` · `in-review` · `closed` (case-insensitive) |
| `--priority <p>` | enum | — | Filter by priority: `low` · `medium` · `high` (case-insensitive) |
| `--limit <n>` | integer | `50` | Maximum number of results |
| `--offset <n>` | integer | `0` | Skip the first n results |

### Example output

```
Found 2 issue(s) matching filters: [status: open, priority: high].

ID    │ TITLE                │ STATUS          │ PRIORITY   │ DESCRIPTION
──────┼──────────────────────┼─────────────────┼────────────┼──────────────────────────────────────────────────
3     │ Fix login bug        │ Open            │ High       │ Users are logged out after 2 min.
7     │ Add retry logic      │ Open            │ High       │ SDK should retry failed requests...
```

When no issues match:

```
No issues matching those filters were found.
```

---

## `baton view <id>`

```
baton view <id>
```

Displays all fields for a single issue. Each call logs a `read` entry to the activity log.

### Example

```bash
baton view 29
```

```
id: 29
createdAt: 2026-05-17T21:32:01.000Z
lastUpdated: 2026-05-18T21:05:44.000Z
attemptNum: 1
title: Fix login bug
status: In-Progress
priority: High
tokenLimit: 4000
description: Users are logged out after 2 min.
assignees: []
```

If the issue does not exist, prints a message and exits with code `0`.

---

## `baton search <query>`

```
baton search <query>
```

Searches issue titles and descriptions case-insensitively. The query can contain spaces (all arguments after `search` are joined).

### Example

```bash
baton search login bug
```

```
Found 1 issue(s) containing "login bug":

ID    │ TITLE                │ STATUS          │ PRIORITY   │ DESCRIPTION
──────┼──────────────────────┼─────────────────┼────────────┼──────────────────────────────────────────────────
3     │ Fix login bug        │ Open            │ High       │ Users are logged out after 2 min.
```

---

## `baton update <id>`

```
baton update <id> [--title <text>] [--description <text>] [--token-limit <n>] [--status <s>] [--priority <level>]
```

Updates one or more fields on an existing issue. At least one flag should be provided.

### Options

| Flag | Type | Description |
|---|---|---|
| `--title <text>` | string | New title |
| `--description <text>` | string | New description |
| `--token-limit <n>` | integer > 0 | New token budget |
| `--status <s>` | enum | `open` · `in-progress` · `in-review` · `closed` |
| `--priority <level>` | enum | `low` · `medium` · `high` |

### Behavior

- Validates the resulting issue against business rules (non-empty title, valid status/priority, positive token limit).
- Writes an `edit` entry to the activity log.
- Prints each changed field with old → new values; unchanged fields are noted explicitly.

### Example

```bash
baton update 3 --title "Revised title"
baton update 7 --status closed --priority medium
```

```
Successfully updated issue #7:
  status: "In-Progress" -> "Closed"
  priority: "Low" -> "Medium"
```

---

## `baton approve <id>`

```
baton approve <id>
```

Moves an issue to `Closed`. Writes a `state_change` entry to the activity log.

> **Note:** The command does not yet enforce that the issue is in `In-Review` before approving.

### Example

```bash
baton approve 5
```

```
Issue #5 approved and moved to Closed.
```

---

## `baton log <id>`

> **Not yet implemented.** Service layer: `getActivityLog(issueId)` in `source/services/issuesService.js`.

```
baton log <id>
```

Displays the full activity history for an issue in chronological order (FR-3.3).

### Expected behavior

- List all entries from the `activity` table for the given issue ID.
- Each entry includes timestamp, action type, and details.
- Entries remain available even after an issue is deleted.

### Planned example output

```
$ baton log 3

Activity log for issue #3
──────────────────────────────────────────
2026-05-17 10:32:01   creation       "Fix login bug" was created.
2026-05-17 11:00:44   read           Issue #3 was accessed.
2026-05-18 09:12:05   state_change   Status changed from Open to In-Progress
2026-05-18 14:05:44   edit           Issue #3 was updated.
```

---

## `baton delete <id>`

> **Not yet implemented.** Service layer: `deleteIssue(id)` in `source/services/issuesService.js`.

```
baton delete <id> [--force]
```

Permanently removes an issue from the tracker (FR-1.4).

### Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--force` | boolean | false | Skip the confirmation prompt |

### Expected behavior

- Write a `deletion` activity log entry before removing the row.
- Prompt for confirmation unless `--force` is passed.
- Warn if an agent is actively working on the issue.

### Planned example

```
$ baton delete 42

Warning: This will permanently delete issue #42. This cannot be undone.
Type the issue ID to confirm: 42

Issue #42 deleted.
```

---

## `baton reject <id>`

> **Not yet implemented.** Service layer: `rejectIssue(id, reason)` in `source/services/issuesService.js`.

```
baton reject <id> --reason <text>
```

Returns an in-review issue to in-progress with a logged reason (FR-7.3).

### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--reason <text>` | string | yes | Description of what needs to change |

### Expected behavior

- Only valid when status is `In-Review`.
- Transitions to `In-Progress`.
- Logs a `rejection` entry with the reason in `details`.

### Planned example

```bash
baton reject 5 --reason "Retry logic is not covered by tests."
```

```
Issue #5 returned to In-Progress. Reason logged.
```

---

## `baton priority <id> <priority>`

> **Not yet implemented.** Service layer: `setPriority(id, priority)` in `source/services/issuesService.js`.

```
baton priority <id> <priority>
```

Dedicated command to change an issue's priority (FR-6.1).

| Argument | Description |
|---|---|
| `<id>` | Issue ID |
| `<priority>` | `low` · `medium` · `high` |

### Note

Priority can currently be changed via `baton update <id> --priority <level>`. This command will provide a focused interface and write a `priority_change` log entry instead of a generic `edit` entry.

### Planned example

```bash
baton priority 3 high
```

```
Issue #3 priority changed to High.
```

---

## Shared Errors

When the tracker is not initialized:

```
Error: No tracker found in this directory.
Run `baton init` first.
```

Invalid or missing arguments print a usage hint and exit with code `1`.
