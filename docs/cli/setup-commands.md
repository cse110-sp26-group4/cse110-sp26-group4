# Setup & Workflow Commands

Commands for initializing the tracker and driving the agent workflow.

See [README](README.md) for the data model, status values, and exit codes.

---

## `baton init`

```
baton init [--force] [--specs <path>] [<specs-path>]
```

Initializes the tracker in the current directory. Creates `.baton/baton.db`, runs schema migrations, and seeds issues from a product specs file.

### Options

| Flag / argument | Type | Default | Description |
|---|---|---|---|
| `--force` | boolean | false | Re-initialize an existing tracker. Clears all issues (activity log is preserved). |
| `--specs <path>` | string | `docs/specs/project-requirements.md` | Path to the specs markdown file |
| `<specs-path>` | string | — | Positional alias for `--specs` (use one or the other, not both) |

### Behavior

- Creates `.baton/` and applies Drizzle migrations to create the `issues` and `activity` tables.
- Parses the specs file for rows marked `Must` with IDs like `FR-1`, and creates one issue per requirement.
- Seeded issues default to `Medium` priority.

### Terminal output

On success:

```
Tracker initialized at /your-project/.baton/baton.db
Specs: /your-project/docs/specs/project-requirements.md
Created 12 issue(s) from product specs.
Issues:
  #1 [Medium] FR-1.1
  ...
Run `baton status` to review progress or `baton next` to start work.
```

If the tracker already exists and `--force` is not passed:

```
Error: Tracker already initialized in this directory.
Run `baton init --force` to re-initialize.
```

### Examples

```bash
baton init
baton init --specs ./my-specs.md
baton init ./my-specs.md
baton init --force
```

---

## `baton status`

```
baton status
```

Prints issue counts by status and overall completion percentage. Requires an initialized tracker.

### Example output

```
Issue Tracker Status
──────────────────────────────────────────
Total issues:     12
Open:             8
In progress:      2
In review:        1
Closed:           1
Overall progress: 8% complete

Open issues by priority:
  High:   1
  Medium: 5
  Low:    2
```

### Errors

```
Error: No tracker found in this directory.
Run `baton init` first.
```

---

## `baton next`

```
baton next
```

Selects the highest-priority open issue and marks it `In-Progress`. Increments `attemptNum` and writes activity log entries. Requires an initialized tracker.

Selection order: priority (`High` → `Medium` → `Low`), then lowest ID.

### Example output

```
Working on next issue:
  ID:          #3
  Title:       FR-1.2
  Priority:    Medium
  Status:      In-Progress
  Attempts:    1
  Created:     14:32:01 2026-05-17
  Description: The system shall allow a human supervisor to read/view issues...
```

If no open issues remain:

```
No open issues available. All work is complete or the backlog is empty.
```

---

## `baton loop`

```
baton loop [--steps <n>]
baton loop -n <n>
```

Runs `baton next` repeatedly for autonomous agent steps. Requires an initialized tracker.

### Options

| Flag | Type | Default | Description |
|---|---|---|---|
| `--steps <n>` | integer ≥ 1 | `1` | Number of steps to run |
| `-n <n>` | integer ≥ 1 | — | Alias for `--steps` |

### Example output

```
Running baton for 3 step(s)...

--- Step 1/3 ---
Working on next issue:
  ID:          #1
  ...

Completed 3 autonomous step(s).
```

---

## `baton config`

> **Not yet implemented.** Service layer and storage for project configuration do not exist yet.

```
baton config set <key> <value>
baton config list
```

Planned commands for setting and viewing project-level defaults (FR-11.2).

### Planned keys

| Key | Type | Default | Description |
|---|---|---|---|
| `defaultTimeoutMinutes` | integer ≥ 1 | `120` | Max time an agent may hold an issue before escalation |
| `duplicateCheckEnabled` | boolean | `true` | Warn on potential duplicate issues at creation time |
| `duplicateCheckThreshold` | float 0–1 | `0.8` | Similarity score above which a duplicate warning is triggered |

### Planned example output (`config list`)

```
Project Tracker Configuration
──────────────────────────────────────────
defaultTimeoutMinutes     120    Max time an agent may hold an issue before escalation
duplicateCheckEnabled     true   Warn on potential duplicate issues at creation time
duplicateCheckThreshold   0.8    Similarity score (0–1) to trigger duplicate warning
```

---

## `baton agent`

> **Not yet implemented.** Agent registration and authentication are not part of the current CLI.

```
baton agent register <id> [--description <text>]
baton agent list
baton agent remove <id> [--force]
```

Planned commands for registering agent identities used by the SDK.

### `baton agent register <id>`

| Argument / flag | Required | Description |
|---|---|---|
| `<id>` | yes | Unique agent identifier (alphanumeric, hyphens, max 64 chars) |
| `--description <text>` | no | Human-readable description of the agent's role |

### `baton agent list`

Lists all registered agents and their metadata.

### `baton agent remove <id>`

Removes a registered agent. Warns if the agent has open or in-progress issues assigned unless `--force` is passed.
