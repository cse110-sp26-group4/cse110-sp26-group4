# Setup CLI Commands

All setup commands follow the pattern: `baton <group> <command> [arguments] [flags]`

---

## `<tool> init`

```
<tool> init [options]
```

Initializes a new issue tracker in the current directory. Creates the `.tracker/` folder and all required files with default values.

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--force` | boolean | false | Re-initialize an existing tracker. Preserves existing data unless `--reset` is also passed. |
| `--reset` | boolean | false | Must be used with `--force`. Wipes all existing issues and config and starts fresh. Prompts for confirmation. |

### Behavior

- Creates `.tracker/` in the current working directory.
- Writes a `config.json` with all default values.
- Creates an empty `issues.json` for issue storage.
- Creates an empty `agents.json` for agent registration.

### Terminal Messages

- If `.tracker/` already exists and `--force` is not passed, exits with an error:
  ```
  Error: Tracker already initialized in this directory.
  Run `<tool> init --force` to re-initialize without losing data.
  ```
- If `--force --reset` is passed, prompts:
  ```
  Warning: This will permanently delete all issues and configuration. Type "reset" to confirm:
  ```
- On success:
  ```
  Tracker initialized in /your-project/.tracker/
  Run `<tool> config list` to review default settings.
  Run `<tool> agent register <id>` to register your first agent.
  ```

### Directory Structure on Init

```
your-project/
└── .tracker/
    ├── config.json   # Project-level configuration
    ├── issues.json   # JSON database
    └── agents.json   # Registered agent identities
```

---

## `<tool> config set <key> <value>`

```
<tool> config set <key> <value>
```

Sets a configuration value for this project.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `key` | Yes | The configuration key to set (see [Config Keys](#config-keys) below). |
| `value` | Yes | The value to assign. Type is validated against the key's expected type. |

### Behavior

- Writes the value to `.tracker/config.json`.
- Validates the value type and range before writing. Rejects invalid values with an error message.
- If the key does not exist, exits with an error listing valid keys.

### Terminal Messages

- If value does not match key type or range:
  ```
  Error: Invalid value for "<key>": expected a <key_type> in <key_range>, got "<value>".
  Run `<tool> config list` to see valid keys and their expected types.
  ```
- If `.tracker/` does not exist:
  ```
  Error: No tracker found in this directory.
  Run `<tool> init` first.
  ```

---

## `<tool> config list`

```
<tool> config list
```

Prints all current configuration values with their descriptions.

### Example Output

```
Project Tracker Configuration (.tracker/config.json)
──────────────────────────────────────────
defaultTimeoutMinutes     60     Max time an agent may hold an issue before escalation
duplicateCheckEnabled     true   Warn on potential duplicate issues at creation time
duplicateCheckThreshold   0.8    Similarity score (0–1) to trigger duplicate warning
```

---

## `<tool> agent register <id>`

```
<tool> agent register <id> [options]
```

Registers a new agent identity with the tracker so it can make authenticated SDK calls.

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `id` | Yes | A unique string identifier for the agent (e.g. `gpt-worker-1`, `claude-dev`). Alphanumeric, hyphens allowed, max 64 chars. |

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--description <text>` | string | Empty | Optional human-readable description of the agent's role. |

### Behavior

- Appends the agent entry to `.tracker/agents.json`.
- Generates and returns an agent token the agent must include in all SDK calls.

### Terminal Messages

- If the ID is already registered:
  ```
  Error: Agent "<id>" is already registered.
  Run `<tool> agent list` to see all registered agents.
  ```

---

## `<tool> agent list`

```
<tool> agent list
```

Lists all registered agents and their metadata.

### Example Output

```
Registered Agents
──────────────────────────────────────────
ID             Description            Registered
gpt-worker-1   Primary coding agent   2026-05-10
claude-dev     QA agent               2026-05-11
```

---

## `<tool> agent remove <id>`

```
<tool> agent remove <id> [options]
```

Removes a registered agent from the tracker.

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--force` | boolean | false | Removes agent entry from `agents.json` regardless of agent working status. |

### Behavior

- Removes the agent entry from `agents.json`.
- Activity log entries made by this agent are preserved (history is immutable).

### Terminal Messages

- If the agent has open or in-progress issues assigned to it:
  ```
  Warning: Agent "<id>" has <num_issues> open issue(s) assigned.
  Removing this agent will leave those issues unassigned.
  Pass --force to proceed anyway.
  ```

---

## Config Keys

Valid keys for `<tool> config set <key> <value>` and `<tool> config list`.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `defaultTimeoutMinutes` | integer ≥ 1 | 120 | Default max time (minutes) an agent may hold an issue before the system escalates it to the supervisor. Can be overridden per-issue. |
| `duplicateCheckEnabled` | boolean | true | Whether to warn on potential duplicate issues at creation time. |
| `duplicateCheckThreshold` | float 0–1 | 0.8 | Similarity score above which a duplicate warning is triggered. 1.0 = exact match only. |

---

## Error Handling Standards

All setup commands follow these conventions:

- Error messages begin with `Error:`.
- Commands validate required options and print a helpful usage hint on failure.
- Missing tracker state prints:
  ```
  Error: No tracker found in this directory.
  Run `<tool> init` first.
  ```
- Invalid input prints the expected type or permitted values.

- **Exit code 0** on success.
- **Exit code 1** on user error (bad args, already initialized, unknown key, etc.).
- **Exit code 2** on unexpected system/runtime error.
- All errors are printed to **stderr**, not stdout, so they don't interfere with scripted use.
- Every error message ends with a suggested corrective action.