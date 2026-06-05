# Baton User Guide

Baton is a terminal-based issue tracker designed for human supervisors and AI agents. It provides a robust CLI to manage issues, track progress, and facilitate seamless collaboration between humans and automated agents.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Initialization](#initialization)
  - [Registration](#registration)
  - [Configuration](#configuration)
- [Core Concepts](#core-concepts)
  - [Issue Data Model](#issue-data-model)
  - [State Machine](#state-machine)
  - [Priority Levels](#priority-levels)
- [Command Reference](cli/README.md)
- [Agent Integration](#agent-integration)
  - [Agent Setup](#agent-setup)
  - [Instruction Files](#instruction-files)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

**Please follow the below steps in order.**

### Prerequisites
- **Node.js**: Version 22.0.0 or higher.
- **npm**: Node Package Manager (comes bundled with Node.js).

### Installation
Baton is available as an npm package. You can install it directly using:

```bash
npm install baton-issue-tracker
```

Note that the above command only installs the package in the local directory. If you'd like to use Baton globally, use 
```bash
npm install -g baton-issue-tracker
```

Once installed, you can run Baton:

```bash
baton <command> [options]
```

### Initialization
**Before any other actions**, you must first initialize the database:

```bash
baton init
```

This command:
1. Creates a local database at `.baton/baton.db`.
2. (Optional) Seeds the database with issues from a requirements file (defaults to `docs/specs/project-requirements.md`).


### Registration
Once initialized, before you can manage issues, you must register your identity. Baton uses this for audit logging and to track who is performing each action.

```bash
# Register yourself as a human. Humans act as supervisors and have more permissions than agents.
baton register --name "your-name" --type human
```

By default, Baton identifies you by your **OS Username**. If you register with a different name, you must configure your identity as described in the [Configuration](#configuration) section.

### Configuration
Baton uses environment variables to identify the active user and set preferences for interactive tasks.

| Variable | Description | Possible Values | Default |
|---|---|---|---|
| `BATON_AGENT` | The name of the current user or agent. Must be registered first. | Any registered name (e.g., `alice`, `dev-bot-1`). | OS Username |
| `EDITOR` | Your primary text editor for multi-line inputs. | `vim`, `nano`, `emacs`, `code --wait`, `notepad`. | — |
| `VISUAL` | Fallback editor if `EDITOR` is not set. | Same as `EDITOR`. | — |

#### Setting `BATON_AGENT`
The `BATON_AGENT` variable is used to attribute actions in the audit log. It must match a name previously registered with `baton register`.
- **Format**: Alphanumeric characters and hyphens (e.g., `agent-007`, `John-Doe`).
- **Usage**: Setting agent name

  Linux/MacOS:
  ```bash
  export BATON_AGENT="my-registered-name"
  ```
  
  Windows:
  ```bash
  $env:BATON_AGENT="my-registered-name"
  ```

#### Setting `EDITOR` or `VISUAL`
When creating or updating issues, you might want to provide a multi-line description. Baton will attempt to open the editor specified in these variables.
- **Terminal Editors**: `vim`, `vi`, `nano`.
- **GUI Editors**:
  - **VS Code**: Use `code --wait`. The `--wait` flag is required so Baton knows when you have finished saving the file.
  - **Sublime Text**: Use `subl -w`.
  - **Notepad (Windows)**: `notepad`.
- **Usage**: Setting VS Code to be opened for inputs

  Linux/MacOS
  ```bash
  export EDITOR="code --wait"
  ```

  Windows
  ```bash
  $env:EDITOR="code --wait"
  ```

---

## Core Concepts

### Issue Data Model
Each issue is identified by a unique integer ID (e.g., `1`, `42`).
Key fields include:
- **ID**: Auto-incrementing identifier.
- **Title**: Short summary.
- **Description**: Detailed explanation.
- **Status**: Current state in the workflow.
- **Priority**: Urgency level (`Low`, `Medium`, `High`).
- **Token Limit**: Optional budget for AI agent work.
- **Attempt Num**: Number of times an agent has attempted the issue.

### State Machine
Issues move through a defined lifecycle:
- `Open`: Available for work.
- `In-Progress`: Active work is being done.
- `In-Review`: Work submitted; awaiting human approval.
- `Closed`: Approved and complete.

**Workflow:**
`Open` → `In-Progress` → `In-Review` → `Closed`
*(Issues can be returned from `In-Review` to `In-Progress` if changes are requested).*

### Priority Levels
- `Low`
- `Medium`
- `High`
Baton prioritizes issues with `High` priority first, then by ID.

---

## Agent Integration

Baton is built to be used by both humans and AI agents. For AI agents, Baton is designed to be a "source of truth" for your codebase.

### Agent Setup
Make sure you have [initialized](#initialization) Baton before this. To integrate an agent:
1. **Register the agent**: 
```bash
baton register --name <my-agent> --type agent
```
2. **Set identity**: Ensure `BATON_AGENT` is set to `<my-agent>` in the     agent's environment, as seen in [configuration](#configuration).

Linux/MacOS:
```bash
export BATON_AGENT="my-registered-name"
```
Windows Powershell:
```bash
$env:BATON_AGENT="my-registered-name"
```
3. **Use JSON output**: Use the `--json` flag for machine-readable data. For example, 

```bash
baton create --title "Fix login bug" --priority high --json
```

### Instruction Files
When configuring an agent environment (e.g. `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`), you should include a reference to `BATON_AGENT_RULES.md`, found [here](BATON_AGENT_RULES).

**Example reference in `AGENTS.md`:**
> Follow the issue tracking protocols defined in `BATON_AGENT_RULES`. Always update issue status when starting or finishing a task.

This ensures the agent maintains consistency across different models and tools while adhering to your team's workflow.

### Development
See the [Developer Guide](CONTRIBUTING.md).

## Troubleshooting

1. **Database is not found**: try running init.
```
baton init
```

2. **Database is locked**: another process may be using it. Close other terminals running Baton and try again.

3. **User is not registered**: ensure you have registered the name of an agent, and the name matches.
```
baton register --name "insert-user-name" --type human
$env:BATON_AGENT="insert-user-name"
```

4. **Baton command is not found**: try running baton --version to see if you have it installed. If not, follow the installation guide.

5. **Changes are not appearing**: try running one of these two commands to refresh the list. Ensure you are in the correct folder, which should be ./baton.
```
baton list
baton status --json
