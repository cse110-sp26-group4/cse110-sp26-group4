# Baton User Guide

Baton is a terminal-based issue tracker designed for human supervisors and AI agents. It provides a robust CLI to manage issues, track progress, and facilitate seamless collaboration between humans and automated agents.

## Table of Contents
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Initialization](#initialization)
    - [Requirements File Format](#requirements-file-format)
  - [Registration](#registration)
  - [Configuration](#configuration)
- [Core Concepts](#core-concepts)
  - [Issue Data Model](#issue-data-model)
  - [State Machine](#state-machine)
  - [Priority Levels](#priority-levels)
- [Typical Daily Workflow (Human Supervisor)](#typical-daily-workflow-human-supervisor)
  - [1. Starting a New Project](#1-starting-a-new-project)
  - [2. Planning and Creating Issues](#2-planning-and-creating-issues)
  - [3. Monitoring the Board](#3-monitoring-the-board)
  - [4. Reviewing and Approving Work](#4-reviewing-and-approving-work)
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

#### Requirements File Format
For `baton init` to automatically create issues, your requirements file (e.g., `requirements.md`) must use a specific Markdown table format. The parser looks for rows containing `| Must |`.

**Example `requirements.md`:**
```markdown
# Project Requirements

| ID     | Priority | Requirement                                   |
|--------|----------|-----------------------------------------------|
| FR-1.1 | Must     | User must be able to log in with email.      |
| FR-1.2 | Must     | System must track token usage per agent.     |
| FR-1.3 | Should   | Support for dark mode in the CLI.            |
```

*Note: Only rows with `FR-` identifiers and `Must` priority are imported as issues during initialization.*


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

## Typical Daily Workflow (Human Supervisor)

This guide walks through a standard day managing AI agents using Baton.

### 1. Starting a New Project
When you first clone a repository or start a new project, you need to set up the Baton environment.

```bash
# Initialize the database and seed it with issues from your requirements doc
baton init

# Register yourself as the project supervisor
baton register --name "Alice" --type human

# Set your identity for the session
export BATON_AGENT="Alice"
```

### 2. Planning and Creating Issues
As the supervisor, you define the tasks for your agents. You can create issues quickly via flags or use the **Interactive Mode** for a more guided experience.

#### Interactive Mode (Recommended for humans)
Simply run `baton create` without any arguments to start the interactive wizard. This will walk you through setting the title, priority, and description (opening your `$EDITOR` for long-form text).

```bash
baton create
```

**What to expect:**
1. **Title**: Enter a concise summary.
2. **Priority**: Select from Low, Medium, or High (with helpful hints).
3. **Token Limit**: Optionally set a budget for AI agents.
4. **Description**: Choose to add a detailed description. If `$EDITOR` is set, Baton will open it (e.g., VS Code or Vim) for you to type the details.

#### Quick Create (via Flags)
For power users or scripts, you can pass all details directly:

```bash
# Create a high-priority feature request
baton create --title "Implement OAuth2 login" --priority high

# Create a medium-priority bug fix
baton create --title "Fix broken CSS on mobile" --priority medium
```

### 3. Monitoring the Board
Throughout the day, you'll want to see how work is progressing across the team.

```bash
# Get a high-level summary of the issue counts by status
baton status

# List all open issues to see what agents can work on next
baton list --status open

# Check the activity log to see who claimed or submitted what
baton log
```

### 4. Reviewing and Approving Work
When an agent completes a task, they move the issue to `In-Review`. It is your job to verify the work and finalize the issue.

```bash
# Find all issues waiting for your review
baton list --status in-review

# Read the full details of a specific issue
baton view 42

# If the work is correct, approve it to close the issue
baton approve 42

# If the work needs changes, reject it to send it back to 'In-Progress'
baton reject 42 --reason "Please add unit tests for the edge cases."
```

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

---

## Troubleshooting

1. **Database not found**: Try initializing the tracker in your project root.
   ```bash
   baton init
   ```

2. **Database is locked**: Another process may be accessing the database file. Close any other instances of Baton and try again.

3. **User is not registered**: Actions require a registered identity. Ensure your `BATON_AGENT` environment variable matches a name registered via the CLI.
   ```bash
   baton register --name "your-name" --type human
   export BATON_AGENT="your-name"
   ```

4. **Command not found**: Ensure Baton is installed globally or use `npx baton` if installed locally.
   ```bash
   npm install -g baton-issue-tracker
   ```

5. **Changes not appearing**: Ensure you are running commands from the project root where the `.baton` directory is located. You can also verify the current database state with:
   ```bash
   baton status --json
   ```
