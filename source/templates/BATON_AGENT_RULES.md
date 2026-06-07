# Baton Agent Rules & System Instructions

This document defines the strict operational boundaries and workflows for all AI agents working within this repository. 

## 1. Single Source of Truth
**Baton is the absolute single source of truth for all tasks, issues, and progress.**
* **BANNED:** Do not use markdown TODO lists, scratchpad memory files, inline comments for tracking, or any other alternative task management methods.
* All state, priority, and assignment must be read from and written to the Baton CLI.

## 2. Authentication

Baton resolves your identity from the `BATON_AGENT` environment variable. If it is not set, it falls back to the OS username, which is typically a human account — **not** an agent account.

**Your human supervisor must set `BATON_AGENT` in your environment before starting your session.** You should not need to set it yourself. If it is missing or wrong, stop and ask the human to set it correctly before proceeding.

### First-time setup (performed by the human supervisor)

```bash
# 1. Register the agent (only needed once per project)
baton register --name <agent-name> --type agent --json

# 2. Set the env variable before launching the agent session
export BATON_AGENT=<agent-name>   # Linux/macOS
# $env:BATON_AGENT="<agent-name>" # Windows PowerShell
```

### Verifying your identity

Once your session is running, confirm `BATON_AGENT` is set correctly:

```bash
baton whoami --json
# Expected: { "actor": { "name": "<agent-name>", "type": "agent" } }
```

If `whoami` returns a `type: "human"` entry you did not register, `BATON_AGENT` is not set — stop and ask your human supervisor to set it.

## 3. Allowed Commands
Agents must interface with Baton using the following commands. **You MUST use the `--json` flag** on all commands to ensure machine-readable output.

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Check Identity** | `baton whoami --json` | Confirm you are authenticated as an agent, not the OS human user. |
| **Check Status** | `baton status --json` | View overall progress and issue counts. |
| **List Issues** | `baton list --status open --json` | View available work (can filter by status/priority). |
| **List In-Progress** | `baton list --status in-progress --json` | Find issues already claimed by you (e.g. after a rejection). |
| **Search Issues** | `baton search "<query>" --json` | Search for existing issues to avoid creating duplicates. |
| **View Issue** | `baton view <id> --json` | Read the full details and requirements of a specific ticket. |
| **View History** | `baton log <id> --json` | Check previous attempts, rejections, and rejection reasons on a ticket. |
| **Claim Issue** | `baton claim <id> --json` | Claim a specific issue and mark it `In-Progress`. Note the `id` returned. |
| **Submit for Review** | `baton submit <id> --json` | Mark a completed task as ready for human approval. |
| **Unclaim Issue** | `baton unclaim <id> --json` | Relinquish a task if you are stuck or hit the loop limit. |
| **Update Issue** | `baton update <id> [options] --json` | Update specific fields (e.g., `--description`) if required. |
| **Create Issue** | `baton create --title "<text>" --json` | Generate a new ticket (e.g., for reporting a bug). |

*Note: Commands like `init`, `loop`, `approve`, `reject`, `priority`, and `delete` are strictly reserved for human supervisors or system orchestration.*

## 4. Standard Workflow
You must strictly adhere to this step-by-step lifecycle for every task:

1. **Authenticate:** Run `baton whoami --json`. Confirm `type` is `"agent"`. If `BATON_AGENT` is not set or returns the wrong identity, stop and ask your human supervisor to set it (see Section 2).
2. **Orient:** Run `baton status --json` to understand the current project state. Also run `baton list --status in-progress --json` — if any issues are already assigned to you (e.g. from a prior session or a rejection), resume those before claiming new work.
3. **Find Work:** Run `baton list --status open --json` to review available issues.
4. **Claim:** Run `baton claim <id> --json` to claim a specific issue by ID. Choose the highest-priority open issue. Note the `id` returned.
5. **Research & Execute:** Read the issue details (`baton view <id> --json`). Perform the necessary research, code changes, and testing to fulfill the requirements.
6. **Submit for Review:** Once the work is complete and verified locally, run `baton submit <id> --json`.
7. **Handle Rejection:** If the human rejects your submission, the issue moves back to `in-progress` and remains assigned to you. Run `baton log <id> --json` to read the rejection reason, address the feedback, and re-run `baton submit <id> --json`. Each rejection counts as a strike (see Section 5).

## 5. Loop Mitigation (The Three-Strike Rule)
To prevent infinite loops and wasted tokens, you must obey the **Three-Strike Rule**:

* If you attempt a task and fail to resolve it **three consecutive times** (e.g., your tests keep failing, or the human rejects your work three times for the same reason), you MUST:
  1. Halt execution on the task.
  2. **Unclaim the issue:** Run `baton unclaim <id> --json` to move it back to `Open`.
  3. Prepend the issue description with a clear explanation of the failure using `baton update <id> --description "FAILED 3 TIMES: [Your brief explanation] \n\n [Original Description]"`.
  4. Stop and prompt the human supervisor for intervention and guidance.