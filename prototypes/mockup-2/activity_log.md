# Activity Log

A complete and immutable activity log is crucial for auditing and understanding the history of every ticket. Every event that occurs in the system is recorded.

## Log Structure

Each entry in the activity log is associated with a ticket and contains the following information:

```json
{
  "log_id": "ulid-for-log-entry",
  "timestamp": "iso-8601-timestamp",
  "ticket_id": "ticket-id",
  "actor": {
    "type": "human" | "ai",
    "id": "user-id" | "agent-id",
    "name": "Display Name"
  },
  "action": "event_type",
  "details": {
    // ... event-specific details
  }
}
```

## Logged Events

Examples of events that will be logged:

*   **`ticket.created`**: When a ticket is created. `details` includes the initial title, description, and creator's reasoning.
*   **`ticket.status.changed`**: When the status changes. `details` includes the old and new status.
*   **`ticket.assignment.changed`**: When the assignee changes.
*   **`comment.added`**: When a comment is added.
*   **`change.proposed`**: When an AI proposes a change. `details` includes a link to the change proposal.
*   **`change.approved`**: When a human approves a change.
*   **`change.rejected`**: When a human rejects a change. `details` includes the reason for rejection.
*   **`ai.work.paused`**: When a human pauses an AI's work.
*   **`ai.work.resumed`**: When a human resumes an AI's work.
*   **`ai.thought`**: The AI's logging of its thinking/reasoning for an action.

## Viewing the Log

The activity log will be visible in both the CLI and the GUI.

**CLI:**

```bash
issue-tracker log TICKET-123
```

**GUI:**

The activity log will be a timeline view on the ticket details page, making it easy to see the sequence of events.
