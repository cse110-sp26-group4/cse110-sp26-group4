# Baton User Guide

Baton is a terminal-based issue tracker designed for human supervisors and AI agents. It provides a simple CLI to manage issues, track progress, and facilitate collaboration between humans and automated agents.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Registration](#registration)
  - [Configuration](#configuration)
  - [Initialization](#initialization)
- [Core Concepts](#core-concepts)
  - [Issue Data Model](#issue-data-model)
  - [Status Values & State Machine](#status-values--state-machine)
  - [Priority Levels](#priority-levels)
- [Command Reference](cli/README.md)
- [Agent Integration](#agent-integration)

---

## Getting Started

### Prerequisites
- **Node.js**: Version 22.0.0 or higher.
- **npm**: Stands for Node Package Manager. Installed with Node.js.

### Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/cse110-sp26-group4/cse110-sp26-group4.git
cd cse110-sp26-group4
npm install
```

To use the `baton` command directly from anywhere in your terminal, run:
```bash
npm link
```

Now you can run Baton simply by typing:
```bash
baton <command> [options]
```

### Registration
Before you can manage issues, you must register yourself (or your agent) in the tracker. Baton uses this identity for audit logging.

```bash
# Register yourself as a human supervisor
baton register --name "your-name" --type human
```

By default, Baton will look for a registered user that matches your **OS Username**. If you register with a different name, see the [Configuration](#configuration) section to set your identity.

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

  Linux/MacOS
  ```bash
  export BATON_AGENT="my-registered-name"
  ```
  
  Windows Powershell
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

### Initialization
To start using Baton in a project, run the `init` command. This creates a local SQLite database at `.baton/baton.db` and can seed issues from a product requirements file.

```bash
baton init
```
By default, it looks for requirements at `docs/specs/project-requirements.md`.

### Usage
Please consult the issue-data model, or run 

```bash
baton --help
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

### Status Values & State Machine
Issues move through a defined lifecycle:
- `Open`: Available for work.
- `In-Progress`: Active work is being done.
- `In-Review`: Work submitted; awaiting human approval.
- `Closed`: Approved and complete.

**State Machine:**
`Open` → `In-Progress` → `In-Review` → `Closed`
*(Issues can be returned from `In-Review` to `In-Progress` if changes are requested).*

### Priority Levels
- `Low`
- `Medium`
- `High`
Baton prioritizes issues with `High` priority first, then by ID.

---

## Agent Integration

Baton is built to be used by both humans and AI agents.

### Audit Logging & Identity
Baton records every change in an activity log. To ensure accurate logging, agents should be registered and the `BATON_AGENT` environment variable should be set to the agent's registered name.

1. **Register the agent:**
   ```bash
   baton register --name "my-ai-agent" --type agent
   ```
2. **Set the identity:**
   ```bash
   export BATON_AGENT="my-ai-agent"
   ```

### Use Your Own Agent 
Baton acts as the **source of truth** for issues and requirements, but it does not execute agent logic itself. If you are building an agent to work with Baton:
- **API Keys**: Your agent implementation (e.g., using OpenAI or Anthropic) will require its own API keys. These should be managed via your own `.env` files or environment settings.
- **SDK**: Use the `baton` CLI with the `--json` flag to programmatically read and update issues.

### Machine-Readable Output
Most commands support a `--json` flag to provide machine-readable output.
```bash
baton list --status open --json
```

For more advanced integration, refer to the [Developer Guide](../CONTRIBUTING.md).
