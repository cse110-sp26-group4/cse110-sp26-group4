# Prototype 1: AI-Integrated Issue Tracker

This is the first functional prototype of the AI-integrated issue tracker CLI tool.

## Features Implemented
*   **SQLite Backend:** Fully persistent storage for issues and activity logs.
*   **Human-in-the-Loop:** Agents can only propose fixes (`Awaiting Approval`). Humans must `approve` them.
*   **Activity History:** Every action (creation, edit, approval, pause) is logged with timestamps and user details.
*   **AI Accountability:** Agents *must* provide reasoning for their work.
*   **Token Management:** Enforces `token_limit` per issue. Auto-pauses tickets if exceeded.
*   **Flexible Output:** Supports standard table output and JSON output for AI compatibility.

## Usage Guide

### 1. Initialize / Create Issue
```bash
python issue.py create --title "Critical Bug" --description "The system crashes on startup." --token-limit 1000 --priority High
```

### 2. List Issues
```bash
python issue.py list
# or for AI agents:
python issue.py list --json
```

### 3. AI Agent Work
```bash
python issue.py work 1 --agent-id "Agent-Alpha" --reasoning "Found a null pointer in main.py" --fix "Added null check at line 24" --tokens 50
```

### 4. Human Approval
```bash
python issue.py view 1
python issue.py approve 1
```

## Internal Data Model
Following `specs/issue-data-model.md`, the prototype uses two main tables:
*   `issues`: Stores the current state of all tickets.
*   `activity`: Stores a permanent audit trail of all changes.

## Next Steps for Prototype 2
*   Implement a "General Chat" interface.
*   Add a TUI (Text User Interface) dashboard using a library like `curtsies` or `rich`.
*   Support for multiple agents and agent retirement.
