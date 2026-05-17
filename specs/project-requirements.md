# Functional & Non-Functional Requirements
## CSE 110 Team #4 — AI Agent Issue Tracker (Terminal CLI)

---

> **Priority legend** — derived from the MoSCoW categories agreed on in Sprint 1:
> - **Must** — required for MVP; the system cannot ship without it
> - **Should** — strongly desired; include if time allows
> - **Could** — nice to have; deferred to a later sprint if needed
> - **Won't** — explicitly out of scope for this MVP

---

## Functional Requirements

Functional requirements describe **what the system must do.** The observable behaviors and features.

---

### FR-1: Issue Management (Human CLI)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-1.1 | Must | The system shall allow a human supervisor to **create** a new issue via the CLI, providing at minimum a title, description, and priority level. |
| FR-1.2 | Must | The system shall allow a human supervisor to **read/view** one or more issues, including all current fields and their full change history. |
| FR-1.3 | Must | The system shall allow a human supervisor to **update** any field of an existing issue (e.g., title, description, priority, status, assignee). |
| FR-1.4 | Must | The system shall allow a human supervisor to **delete** an issue from the tracker. |
| FR-1.5 | Should | The system shall support flags and parameters on CLI commands (e.g., filtering by status, priority, or assignee) to improve usability for human supervisors. |

---

### FR-2: Issue Management (Agent SDK/API)

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-2.1 | Must | The system shall expose a programmatic SDK (or API) that allows an AI agent to **create** issues. |
| FR-2.2 | Must | The system shall allow an AI agent to **read** issue details, including current status and priority. |
| FR-2.3 | Must | The system shall allow an AI agent to **update** the status or fields of an issue it is actively working on. |
| FR-2.4 | Must | The system shall allow an AI agent to **delete** an issue only under defined, controlled conditions (not autonomously or arbitrarily). |
| FR-2.5 | Should | Agent SDK commands shall expose detailed and specific parameters suited for automated, programmatic use (distinct from the human CLI interface). |

---

### FR-3: Activity History & Audit Log

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-3.1 | Must | The system shall record a timestamped log entry for every change made to an issue, regardless of whether the actor is a human or an AI agent. |
| FR-3.2 | Must | Each log entry shall capture: the field changed, the old value, the new value, the actor (human or agent ID), and a timestamp. |
| FR-3.3 | Must | A human supervisor shall be able to retrieve the full change history for any individual issue via the CLI. |

---

### FR-4: Issue Data Model

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-4.1 | Must | Each issue shall have a unique identifier (auto-generated). |
| FR-4.2 | Must | Each issue shall have the following **required** fields: title, description, status, priority, created-at timestamp, and last-updated timestamp. |
| FR-4.3 | Should | Each issue shall support the following **optional** fields: assignee (agent ID), labels/tags, resolution notes, and parent/related issue references. |
| FR-4.4 | Must | Issue status shall follow a defined state machine (e.g., `open → in-progress → in-review → closed`). |
| FR-4.5 | Must | Issue data shall be persisted locally using SQLite or a JSON-based file store. |

---

### FR-5: Core Issue Lifecycle Workflows

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-5.1 | Must | The system shall support the workflow: **Human creates issue → Agent picks up issue → Agent resolves issue → Issue is closed.** |
| FR-5.2 | Must | The system shall support the workflow: **Agent reports/creates issue → Agent resolves issue.** |
| FR-5.3 | Must | An agent shall only be able to close an issue after human approval (see FR-7). |

---

### FR-6: Prioritization Workflows

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-6.1 | Must | A human supervisor shall be able to view open issues and assign or update their priority. The tracker shall reflect the new ordering. |
| FR-6.2 | Could | When a human reprioritizes an issue to a higher level, the system shall signal the currently assigned agent to drop its current task and pick up the newly prioritized issue. |

---

### FR-7: Review Workflows

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-7.1 | Must | When an agent marks an issue as complete, the system shall place the issue into a "pending review" state and notify the human supervisor. |
| FR-7.2 | Must | A human supervisor shall be able to **approve** a completed issue, causing the system to close it. |
| FR-7.3 | Must | A human supervisor shall be able to **request changes** on a completed issue, returning it to an "in-progress" state and reassigning it to the agent. |

---

### FR-8: Clarification Workflows

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-8.1 | Should | An agent shall be able to post a clarifying question on an issue and enter a "blocked/awaiting response" state. |
| FR-8.2 | Should | A human supervisor shall be able to respond to an agent's question via the CLI, unblocking the agent. |
| FR-8.3 | Could | If a human does not respond within a configurable timeout period, the system shall allow the agent to either: (a) proceed with its best judgment and log the assumption made, or (b) move to a different available issue and mark the original as blocked. |

---

### FR-9: Failure Workflows

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-9.1 | Must | If an agent explicitly reports failure on an issue, the system shall move the issue back to "open" or a "failed" state and log the failure reason. |
| FR-9.2 | Should | The system shall detect and surface **silent failures** (e.g., an agent has not updated an issue within the configured time limit) and alert the human supervisor. |
| FR-9.3 | Should | The system shall detect **duplicate issues** (e.g., by matching title or description similarity) and warn the user or agent before creation is finalized. |

---

### FR-10: Agent Time Limits

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-10.1 | Should | Each issue shall support a configurable maximum resolution time. If an agent exceeds this limit without resolving the issue, the system shall automatically escalate it (alert the supervisor and/or unassign the agent). |
| FR-10.2 | Could | The time limit shall be configurable at both the system level (default) and the individual issue level (override). |

---

### FR-11: Setup & Configuration

| ID | Priority | Requirement |
|----|----------|-------------|
| FR-11.1 | Must | The system shall provide an initialization command (e.g., `tracker init`) to set up the local environment, storage, and configuration file. |
| FR-11.2 | Should | The system shall provide configuration commands to set global defaults (e.g., default time limits, storage path, agent ID format). |

---

## Non-Functional Requirements

Non-functional requirements describe **how well the system performs.** The qualities, constraints, and standards.

---

### NFR-1: Usability

| ID | Requirement |
|----|-------------|
| NFR-1.1 | CLI commands shall follow standard POSIX/Unix conventions so that any developer familiar with command-line tools can use them without extensive documentation. |
| NFR-1.2 | All CLI commands shall produce clear, human-readable output. Error messages shall describe what went wrong and suggest a corrective action. |
| NFR-1.3 | The system shall provide a `--help` flag on every command that outputs usage instructions and available options. |

---

### NFR-2: Performance

| ID | Requirement |
|----|-------------|
| NFR-2.1 | All CLI commands shall complete and return output within **2 seconds** under normal operating conditions (single user, local storage). |
| NFR-2.2 | Activity history retrieval for any single issue shall complete within **2 seconds**, regardless of the number of log entries. |

---

### NFR-3: Reliability & Data Integrity

| ID | Requirement |
|----|-------------|
| NFR-3.1 | No issue data or activity history shall be lost due to an interrupted CLI command or application crash (i.e., writes must be atomic or transactional). |
| NFR-3.2 | The system shall validate all inputs (human and agent) before writing to storage and reject malformed or out-of-range values with a descriptive error. |

---

### NFR-4: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-4.1 | The codebase shall pass all linting and formatting checks as enforced by the CI pipeline on every pull request. |
| NFR-4.2 | The CI pipeline shall automatically run the test suite on every pull request, and a PR may not be merged unless all tests pass. |
| NFR-4.3 | All architectural decisions shall be documented in ADRs (Architecture Decision Records) and stored in the GitHub repository. |

---

### NFR-5: Portability

| ID | Requirement |
|----|-------------|
| NFR-5.1 | The CLI tool shall run on macOS and Linux. Windows support is a stretch goal, not required for the MVP. |
| NFR-5.2 | The tool shall not require any external services (cloud databases, hosted APIs) to run. It must be fully functional in an offline, local environment. |

---

### NFR-6: Scope Constraints (MVP Boundaries)

| ID | Requirement |
|----|-------------|
| NFR-6.1 | The MVP shall support a **single user/team only**. Multi-user or multi-team support is explicitly out of scope. |
| NFR-6.2 | The system shall not require or produce a graphical user interface. All interaction is via the terminal. |
| NFR-6.3 | The system shall not generate statistics, dashboards, or reports (out of scope for MVP). |
| NFR-6.4 | An agent shall never be permitted to delete or replace large sections of code autonomously. Any such action requires explicit human approval outside of this system. |

---

*Document owner: Zachary Huang | Last updated: May 10, 2026