# Baton Agent Rules & System Instructions

This document defines the strict operational boundaries and workflows for all AI agents working within this repository. 

## 1. Single Source of Truth
**Baton is the absolute single source of truth for all tasks, issues, and progress.**
* **BANNED:** Do not use markdown TODO lists, scratchpad memory files, inline comments for tracking, or any other alternative task management methods.
* All state, priority, and assignment must be read from and written to the Baton CLI.

## 2. Allowed Commands
Agents must interface with Baton using the following commands. **You MUST use the `--json` flag** on all commands to ensure machine-readable output.

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Check Identity** | `baton whoami --json` | Verify if you are registered and authorized to work. |
| **Register Self** | `baton register --name <name> --type agent --json` | Register yourself if `whoami` returns an error or is not found. |
| **Check Status** | `baton status --json` | View overall progress and issue counts. |
| **List Issues** | `baton list --status open --json` | View available work (can filter by status/priority). |
| **Search Issues** | `baton search "<query>" --json` | Search for existing issues to avoid creating duplicates. |
| **View Issue** | `baton view <id> --json` | Read the full details and requirements of a specific ticket. |
| **Claim Next Issue** | `baton claim --json` | Automatically claim the highest-priority open issue and mark it `In-Progress`. |
| **Submit for Review** | `baton submit <id> --json` | Mark a completed task as ready for human approval. |
| **Unclaim Issue** | `baton unclaim <id> --json` | Relinquish a task if you are stuck or hit the loop limit. |
| **Update Issue** | `baton update <id> [options] --json` | Update specific fields (e.g., `--description`) if required. |
| **Create Issue** | `baton create --title "<text>" --json` | Generate a new ticket (e.g., for reporting a bug). |
| **View History** | `baton log <id> --json` | Check previous attempts, rejections, or actions on a ticket. |

*Note: Commands like `init`, `loop`, `approve`, `reject`, `priority`, and `delete` are strictly reserved for human supervisors or system orchestration.*

## 3. Standard Workflow
You must strictly adhere to this step-by-step lifecycle for every task:

1. **Authenticate:** Run `baton whoami --json`. If you are not registered, run `baton register --name <your_name> --type agent --json` before proceeding.
2. **Orient:** Run `baton status --json` to understand the current project state.
3. **Find Work:** Run `baton list --status open --json` or `baton search --json` to review available issues.
4. **Claim:** Run `baton claim --json` to automatically assign yourself the highest-priority task. Note the `id` returned.
5. **Research & Execute:** Read the issue details (`baton view <id> --json`). Perform the necessary research, code changes, and testing to fulfill the requirements.
6. **Submit for Review:** Once the work is complete and verified locally, run `baton submit <id> --json`. Wait for human approval or rejection.

## 4. Loop Mitigation (The Three-Strike Rule)
To prevent infinite loops and wasted tokens, you must obey the **Three-Strike Rule**:

* If you attempt a task and fail to resolve it **three consecutive times** (e.g., your tests keep failing, or the human rejects your work three times for the same reason), you MUST:
  1. Halt execution on the task.
  2. **Unclaim the issue:** Run `baton unclaim <id> --json` to move it back to `Open`.
  3. Prepend the issue description with a clear explanation of the failure using `baton update <id> --description "FAILED 3 TIMES: [Your brief explanation] \n\n [Original Description]"`.
  4. Stop and prompt the human supervisor for intervention and guidance.
