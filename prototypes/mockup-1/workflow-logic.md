# Workflow & Business Logic

This document outlines the internal logic for key features of the AI-integrated issue tracker.

## 1. Human-in-the-Loop Approval Workflow
To ensure safety and quality, all significant changes must be approved by a human.

1.  **Agent Action:** Agent performs `issue agent work <id>` and submits a change.
2.  **State Change:** The issue state moves to `Awaiting Approval`.
3.  **Notification:** The TUI dashboard highlights the ticket in the "Approval Queue".
4.  **Human Review:** Human uses `issue view <id>` to see the `reasoning` and proposed changes.
5.  **Resolution:**
    *   `issue approve <id>`: Applies changes and moves state to `Closed` (or back to `Open` if more work is needed).
    *   `issue pause <id>`: If the agent is going down the wrong path.
    *   `issue agent retire <agent_id>`: If the agent repeatedly proposes bad solutions.

## 2. AI Accountability & Token Tracking
*   **Token Limits:** Each ticket can have a `token_limit`. If an agent exceeds this, the ticket is automatically paused, and a human is notified.
*   **Reasoning Logs:** Agents *must* provide a reasoning string for every state change. This is stored in the `activity` table.
*   **Performance Metrics:** The system tracks:
    *   Success rate (approved fixes vs. total attempts).
    *   Average tokens per successful fix.
    *   Time to resolution.

## 3. Dependency Management (Agent Waiting)
To prevent agents from colliding or solving redundant problems:
*   **Blocking Tickets:** Issues can be marked as "Blocked By #ID".
*   **Agent Logic:** If an agent attempts to take a blocked ticket, the system returns a `409 Conflict` (or CLI error) stating: "Ticket #X is blocked by #Y. Wait for #Y to be resolved."
*   **Sequential Resolution:** Agents are instructed (via their system prompt or API constraints) to resolve dependencies first.

## 4. General Chat Deconstruction
The `issue chat` feature uses a Large Language Model (LLM) to:
1.  Receive unstructured input: "We need to add dark mode and fix the flickering header."
2.  Analyze: Identify two distinct tasks.
3.  Action: Call `issue create` for each task:
    *   Ticket #1: "Implement Dark Mode" (Category: UI)
    *   Ticket #2: "Fix Header Flickering" (Category: Bug, Priority: Medium)

## 5. Time Limits & Stale Tickets
*   **CRUD Attempt Limit:** If a ticket has been in `In Progress` for more than X hours (default 24) without a proposal, it is flagged as "Stale".
*   **Auto-Pause:** Stale tickets are automatically paused to prevent agents from idling or wasting tokens on dead ends.
