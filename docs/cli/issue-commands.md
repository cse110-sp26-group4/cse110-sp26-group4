# Issue Commands

All issue commands follow the pattern: `baton issue <verb> [issue-id] [flags]`

Issue IDs are auto-generated in the format `ISS-###` and are always distinct from agent IDs.

---

## State Machine

All valid status transitions:

```
open ──→ in-progress ──→ in-review ──→ closed
              ↑                ↓
           blocked          rejected
                               ↓
                           in-progress
           
```

| Status | Set by |
|---|---|
| `open` | System (on create) |
| `in-progress` | Agent (SDK) |
| `blocked` | Agent (SDK) |
| `in-review` | Agent (SDK) |
| `closed` | Human via `baton issue approve` |


---

## Commands

### `baton issue create`

```
baton issue create --title <text> --desc <text> --priority <level> [flags]
```

| Flag | Type | Required | Description |
|---|---|---|---|
| `--title <text>` | string | Yes | Short summary. Max 128 chars. |
| `--desc <text>` | string | Yes | Full description of the issue. |
| `--priority <level>` | enum | Yes | `low` · `medium` · `high` |
| `--assignee <agent-id>` | string | No | Assign to a registered agent immediately. |
| `--label <text>` | string | No | Repeatable. Attach one or more labels. |
| `--timeout <minutes>` | integer ≥ 1 | No | Per-issue resolution time limit. Overrides `defaultTimeoutMinutes` from config. |

**Behavior:**
- Sets initial status to `open` and records `created-at` and `last-updated` timestamps.
- If `duplicateCheckEnabled` is `true`, checks for similar issues before writing and warns if similarity exceeds `duplicateCheckThreshold`.

```
$ baton issue create --title "Fix login timeout" --desc "Users are logged out after 2 min." --priority high

Issue ISS-042 created.
Run `baton issue show ISS-042` to view it.
```

---

### `baton issue list`

```
baton issue list [flags]
```

| Flag | Type | Description |
|---|---|---|
| `--status <status>` | enum | Filter by `open` · `in-progress` · `in-review` · `blocked` · `failed` · `closed` |
| `--priority <level>` | enum | Filter by `low` · `medium` · `high` · `critical` |
| `--assignee <agent-id>` | string | Filter to issues assigned to a specific agent. |

Results are sorted by priority (descending), then `created-at` (ascending).

```
$ baton issue list --status blocked

Blocked Issues ─────────────────────────────────────────
ID        Title                       Priority   Assignee
ISS-039   Add retry logic to SDK      medium     gpt-worker-1
ISS-031   Write unit tests for auth   low        claude-dev
```

---

### `baton issue show <issue-id>`

```
baton issue show <issue-id>
```

Displays all fields for a single issue. When the issue is `blocked`, the agent's clarifying question is shown prominently so the human has full context before responding.

```
$ baton issue show ISS-039

Issue ISS-039 ──────────────────────────────────────────
Title        Add retry logic to SDK
Status       blocked
Priority     medium
Assignee     gpt-worker-1
Labels       backend, sdk
Created      2026-05-17 10:32:01
Updated      2026-05-18 14:05:44  

Description
  The SDK should retry failed requests up to 3 times with exponential backoff.

Blocked — Agent question
  Should the retry logic apply to all error codes, or only 5xx? 4xx errors
  like 401 are likely not retryable.

Run `baton issue respond ISS-039 -m <message>` to unblock this issue.
```

---

### `baton issue history <issue-id>`

```
baton issue history <issue-id>
```

Displays the full timestamped activity log for an issue in chronological order. Each entry includes the actor, field changed, old value, and new value.

```
$ baton issue history ISS-039

History for ISS-039 ────────────────────────────────────
2026-05-17 10:32:01   [human]        Issue created. Status: open, Priority: medium
2026-05-17 11:00:44   [human]        assignee: — → gpt-worker-1
2026-05-18 09:12:05   [gpt-worker-1] status: open → in-progress
2026-05-18 14:05:44   [gpt-worker-1] status: in-progress → blocked
                                     question: "Should retry apply to all error codes?"
```

---

### `baton issue update <issue-id>`

```
baton issue update <issue-id> [flags]
```

Updates one or more fields. At least one flag must be provided.

| Flag | Type | Description |
|---|---|---|
| `--title <text>` | string | New title. |
| `--desc <text>` | string | New description. |
| `--priority <level>` | enum | New priority: `low` · `medium` · `high` · `critical` |
| `--label <text>` | string | Repeatable. Replaces existing labels. |
| `--timeout <minutes>` | integer ≥ 1 | Update the per-issue resolution time override. |

```
$ baton issue update ISS-042 --priority critical

ISS-042 updated.
```

---

### `baton issue assign <issue-id>`

```
baton issue assign <issue-id> --agent <agent-id>
```

Assigns or reassigns an issue to a registered agent.

```
$ baton issue assign ISS-042 --agent gpt-worker-1

ISS-042 assigned to gpt-worker-1.
```

---

### `baton issue respond <issue-id>`

```
baton issue respond <issue-id> -m <message>
```

| Flag | Type | Required | Description |
|---|---|---|---|
| `-m <message>` | string | Yes | Response to the agent's clarifying question. Logged to the activity log and surfaced to the assigned agent. |

Responds to a blocked issue. Only valid when status is `blocked`. Transitions the issue back to `in-progress` and appends the message to the activity log so the agent can read it and continue.

```
$ baton issue respond ISS-039 -m "Retry on 5xx only. Treat 4xx as non-retryable."

ISS-039 unblocked. Response logged and agent notified.
```

---

### `baton issue approve <issue-id>`

```
baton issue approve <issue-id>
```

Approves a completed issue. Only valid when status is `in-review`. Transitions the issue to `closed`.

```
$ baton issue approve ISS-042

ISS-042 approved and closed.
```

---

### `baton issue reject <issue-id>`

```
baton issue reject <issue-id> --reason <text>
```

| Flag | Type | Required | Description |
|---|---|---|---|
| `--reason <text>` | string | Yes | Description of what needs to change. Logged and surfaced to the assigned agent. |

Rejects a completed issue. Only valid when status is `in-review`. Transitions the issue back to `in-progress` and reassigns it to the original agent.

```
$ baton issue reject ISS-042 --reason "Retry logic is not covered by tests."

ISS-042 returned to in-progress. Reason logged and agent notified.
```

---

### `baton issue delete <issue-id>`

```
baton issue delete <issue-id> [--force]
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--force` | boolean | false | Skip the confirmation prompt. |

Permanently removes an issue from `issues.json`. Human supervisor use only. Agent-triggered deletion is not permitted. Activity log entries are preserved.

If the issue has an agent actively working on it, exits with a warning unless `--force` is passed.

```
$ baton issue delete ISS-042

Warning: This will permanently delete ISS-042. This cannot be undone.
Type the issue ID to confirm: ISS-042

ISS-042 deleted.
```