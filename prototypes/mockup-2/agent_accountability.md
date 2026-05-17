# Agent Accountability

To ensure AI agents are effective and efficient, a system for monitoring their performance and holding them "accountable" is necessary.

## Performance Metrics

The following metrics will be tracked for each AI agent:

*   **Tickets Closed:** The total number of tickets successfully closed by the agent.
*   **Average Resolution Time:** The average time from when an agent is assigned a ticket to when it's closed.
*   **Rejection Rate:** The percentage of proposed changes that are rejected by human reviewers.
*   **Token Usage:** The average number of tokens used per ticket.
*   **Code Quality Score:** If possible, integrate with a static analysis tool to score the quality of the code produced by the AI.

## Agent Status

Based on these metrics, an agent can have one of the following statuses:

*   **`active`**: The agent is performing within acceptable parameters.
*   **`probation`**: The agent's performance has dropped below a certain threshold (e.g., rejection rate > 50%). The agent may be given simpler tasks or have its budget reduced.
*   **`retired`**: The agent consistently performs poorly and is taken out of the active pool. It will no longer be assigned new tickets. A human can choose to reactivate it later.

## Management

**GUI:**

A dedicated "Agents" page in the GUI will allow users to:
*   View a leaderboard of all agents and their performance metrics.
*   Manually change an agent's status.
*   Drill down into an agent's history to see every ticket it has worked on.

**CLI:**

```bash
# List all agents and their status
issue-tracker agent list

# Show detailed performance metrics for a specific agent
issue-tracker agent show <agent_id>
```
