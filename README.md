<p align="center">
  <img src="./admin/branding/teamLogo.png" width="100">
</p>

# Baton Issue Tracker (Baton)

[![NPM Version](https://img.shields.io/npm/v/baton-issue-tracker)](https://www.npmjs.com/package/baton-issue-tracker)

**Baton** is a terminal-first issue tracker designed for the modern AI-augmented software engineering workflow. It provides a structured interface for human supervisors to manage, track, and approve tasks performed by autonomous AI agents.

In an environment where AI does much of the heavy lifting, Baton ensures accountability, tracks token budgets, and maintains a rigorous audit trail of every change made to your project's backlog.

**Baton** is developed and maintained by **Team Fantastic Four**.

--- 

## Quickstart

Get up and running with Baton in seconds.

### 1. Installation
Install Baton globally via NPM:
```bash
npm install -g baton-issue-tracker
```

### 2. Initialization
Initialize a new tracker in your project root. This creates a local SQLite database at `.baton/baton.db`.
```bash
baton init
```

### 3. Check Identity
Verify your registration or add yourself to the project:
```bash
baton whoami
# If not registered:
baton register --name "your-name" --type human
```

### 4. Basic Workflow
* **Create a task:** `baton create --title "Fix login bug" --priority high`
* **Check status:** `baton status`
* **Claim next task (for agents):** `baton claim`
* **Submit work (for agents):** `baton submit <id>`
* **Approve work (for humans):** `baton approve <id>`

---

## Features

*   **AI-Native API:** All commands support a `--json` flag for easy integration with AI agent loops.
*   **Human-in-the-Loop:** A strict state machine ensuring agents can only resolve issues with human approval.
*   **Full Activity History:** Track every edit, status change, and assignment with `baton log`.
*   **Token Management:** Assign token limits to specific issues to control agent costs.
*   **Zero-Config Storage:** Fully local SQLite storage—no external servers required.

---

## Documentation Index

Baton is extensively documented to help both humans and agents get the most out of the system:

### **Guides**
*   [**CLI Reference**](./docs/cli/README.md): Detailed documentation for every command and flag.
*   [**Setup & Workflow**](./docs/cli/setup-commands.md): How to initialize and manage the agent work-loop.
*   [**Issue Management**](./docs/cli/issue-commands.md): Deep dive into ticket CRUD and review processes.
*   [**Contributing**](./CONTRIBUTING.md): Guidelines for developing and extending Baton.

### **Specifications**
*   [**Product Requirements**](./docs/specs/project-requirements.md): The functional goals of the project.
*   [**Data Model**](./docs/specs/issue-data-model.md): Detailed schema for issues and activity logs.
*   [**ADRs (Architecture Decisions)**](./docs/adr/): Why we built Baton the way we did.

---

## Team
Baton is developed and maintained by **Team Fantastic Four** (CSE 110, SP26). 
Meet the team on our [**Team Page**](./admin/team.md).

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
