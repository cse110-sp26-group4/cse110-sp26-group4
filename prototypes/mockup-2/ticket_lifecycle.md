# Ticket Lifecycle & Dependencies

This document outlines the rules governing the lifecycle of a ticket, including time limits and dependencies.

## Time Limits

To prevent an AI agent from spending too much time (and tokens) on a single ticket, each ticket can have a time limit for resolution attempts.

*   **Configuration:** A default time limit can be set in `.issue-tracker/config.yml`. This can be overridden on a per-ticket basis.
*   **Enforcement:** If an AI agent has a ticket assigned for longer than the specified limit without proposing a solution, the ticket is unassigned from the agent, its status is marked as `open`, and a human is notified.

```yaml
# in .issue-tracker/config.yml
agent_config:
  default_resolution_time_limit: "24h" # 24 hours
```

## Dependency Management

AI agents need to be aware of ticket dependencies to avoid trying to solve a problem that is blocked by another issue.

*   **Declaration:** When a ticket is created (by a human or AI), it can declare a list of `dependencies` (other ticket IDs).
*   **Agent Behavior:** An AI agent assigned to a ticket that has unresolved dependencies will be instructed to wait.
    *   The agent's primary instruction will be to monitor the status of its dependencies.
    *   It can use the `GET /api/v1/issues/{issue_id}` endpoint to check the status of the blocking tickets.
    *   Once all dependencies are `closed`, the agent will be instructed to begin work on its own ticket.
*   **System Check:** The system will prevent an agent from being assigned to a ticket if its dependencies are not yet resolved, unless a human explicitly overrides this.
