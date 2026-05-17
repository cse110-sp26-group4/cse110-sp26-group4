# Approval Workflows

To ensure human oversight, no change proposed by an AI agent can be merged without explicit approval from a human user.

## The Approval Process

1.  **Proposal:** An AI agent submits a change proposal via the `POST /api/v1/issues/{issue_id}/propose_change` endpoint.
2.  **Status Change:** The issue status automatically changes to `in_review`.
3.  **Notification:** The human user(s) assigned to or watching the ticket are notified of the pending review.
4.  **Review:** The human user reviews the proposed change in the GUI. The review interface will show:
    *   The AI's reasoning for the change.
    *   A rich diff of the code changes.
    *   The results of any automated tests that were run against the proposed change.
5.  **Decision:** The user has three options:
    *   **Approve:** The change is automatically merged, and the ticket is moved to the `closed` status.
    *   **Approve with Comments:** The change is merged, the ticket is closed, and the comments are added to the ticket for the AI's future learning.
    *   **Reject:** The user must provide a reason for the rejection. The ticket is moved back to the `in_progress` status, and the AI agent is notified of the rejection and the reason. The agent can then attempt a new solution.

## Pre-computation Approvals

For certain actions that an AI might take *before* proposing a full solution (e.g., installing a new dependency, running a potentially long-running test suite), the system can be configured to require user approval.

This is defined in a project-level configuration file (`.issue-tracker/config.yml`):

```yaml
agent_permissions:
  require_approval_for:
    - "shell.run:npm install *"
    - "shell.run:go get *"
    - "test.run:--suite=long_running"
```

If an agent attempts one of these actions, it will be paused, and a request for approval will be sent to the user.
