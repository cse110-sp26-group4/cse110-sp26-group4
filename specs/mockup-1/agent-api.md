# AI Agent API Design

To support programmatic access for AI agents, the `issue` system exposes a set of API endpoints. These can be accessed via a local server (e.g., `issue serve`) or simulated through JSON CLI flags.

## Base URL
`http://localhost:8080/api/v1`

## Endpoints

### 1. Issues CRUD
*   `GET /issues`: List all issues. Supports query params: `status`, `priority`, `assignee`.
*   `GET /issues/:id`: Get full details of a specific issue.
*   `POST /issues`: Create a new issue.
*   `PATCH /issues/:id`: Update an issue (e.g., status, description).
    *   **Requirement:** Must include a `reasoning` field in the request body.
*   `DELETE /issues/:id`: Delete an issue.

### 2. Agent Management
*   `POST /agents/register`: Register an agent. Returns an `agent_token`.
*   `GET /agents/status`: Check status of all agents.
*   `POST /agents/:id/retire`: Retire an agent.

### 3. Workflow Control
*   `POST /issues/:id/take`: Assign an issue to the calling agent.
*   `POST /issues/:id/propose`: Submit a fix or change for approval.
    *   Payload: `{ "proposed_changes": "...", "reasoning": "...", "estimated_tokens": 500 }`
*   `GET /issues/:id/approval-status`: Check if a proposed change was approved or rejected.

### 4. Communication
*   `POST /chat`: Send a message to the general chat. AI responds with deconstructed tickets.
*   `GET /issues/:id/summary`: Get an AI-generated summary of the ticket.

## Security & Accountability
*   **Agent Tokens:** Every request from an AI agent must include an `X-Agent-Token` header.
*   **Approval Gate:** Any `PATCH` or `propose` action that modifies the codebase or status (except 'Open' to 'In Progress') is held in a 'Pending Approval' state until a human executes `issue approve`.
*   **Token Tracking:** Every API response includes the current token usage for the agent.

## Example Request (Agent Proposing a Fix)
```http
PATCH /api/v1/issues/105/propose
Content-Type: application/json
X-Agent-Token: agent-uuid-12345

{
  "reasoning": "Found memory leak in cache.js. Added TTL to the cache object.",
  "status_change": "awaiting_approval",
  "details": "Modified src/cache.js line 45 to include a timer."
}
```
