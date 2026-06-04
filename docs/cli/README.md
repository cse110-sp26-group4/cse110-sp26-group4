# Baton CLI Reference

Baton is a terminal issue tracker for human supervisors and AI agents. All commands use a flat structure:

```
baton <command> [arguments] [flags]
```

Run `baton --help` for a quick summary.

## Documentation

| Document | Contents |
|---|---|
| [Commands Reference](commands-reference.md) | Comprehensive reference for all CLI commands, flags, and JSON outputs. |

## Storage

Initialization creates a local SQLite database at `.baton/baton.db` in the current working directory. Schema migrations run automatically on `baton init`.

## Issue Data Model

Issues are identified by auto-incrementing integer IDs (e.g. `3`, `29`).

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | integer | auto | — | Unique issue identifier |
| `title` | string | yes | `Issue #<id>` | Short summary (auto-set by trigger if omitted on create) |
| `description` | string | no | — | Full issue description |
| `status` | enum | yes | `Open` | See [Status values](#status-values) |
| `priority` | enum | no | `Low` | `Low` · `Medium` · `High` |
| `tokenLimit` | integer | no | — | Optional token budget for agent work |
| `attemptNum` | integer | auto | `0` | Number of agent attempts on this issue |
| `createdAt` | timestamp | auto | now | Creation time |
| `lastUpdated` | timestamp | auto | now | Last modification time |
| `assignees` | JSON array | no | `[]` | Reserved for future assignee support |

Activity log entries are stored in the `activity` table. See [Issue Data Model](../specs/issue-data-model.md) for the full schema.

## Status Values

Stored values use Pascal-case. CLI flags accept case-insensitive forms (e.g. `open`, `in-progress`, `in-review`, `closed`).

| Status | Description |
|---|---|
| `Open` | Available for an agent to pick up |
| `In-Progress` | An agent is actively working on the issue |
| `In-Review` | Agent submitted work; awaiting human approval |
| `Closed` | Approved and complete |

### State Machine

```
Open ──→ In-Progress ──→ In-Review ──→ Closed
              ↑                │
              └────────────────┘
                    (reject)
```

## Priority Values

| Stored value | CLI flag value |
|---|---|
| `Low` | `low` |
| `Medium` | `medium` |
| `High` | `high` |

Open issues are ordered by priority (High first) then by ID when selecting the next issue.

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | User error (bad arguments, tracker not initialized, unknown command) |
| `2` | Unexpected runtime error |

Error messages are printed to **stderr** and include a suggested corrective action where possible.

## Command Index

| Command | Status | Description |
|---|---|---|
| `init` | Implemented | Initialize storage and seed issues |
| `register` | Implemented | Register a new AI agent or human user |
| `status` | Implemented | Show issue counts and progress |
| `next` | Implemented | Work on the next highest-priority issue |
| `loop` | Implemented | Run autonomous agent steps |
| `create` | Implemented | Create a new issue |
| `list` | Implemented | List issues with filters |
| `view` | Implemented | View all fields for a single issue |
| `search` | Implemented | Search issues by keyword |
| `update` | Implemented | Update one or more issue fields |
| `approve` | Implemented | Approve an issue and close it |
| `reject` | Implemented | Reject an issue with a reason |
| `priority` | Implemented | Quickly set an issue's priority |
| `log` | Implemented | Show activity history for an issue |
| `delete` | Implemented | Permanently remove an issue |
| `config` | Planned | Project-level configuration |
