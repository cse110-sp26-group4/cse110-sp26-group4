# Agent API

This document specifies the REST API endpoints that AI agents will use to interact with the issue tracking system.

## Authentication

All API requests must include an API key in the `Authorization` header.

`Authorization: Bearer <AGENT_API_KEY>`

## Endpoints

### Issues

#### `POST /api/v1/issues`

Create a new issue.

**Request Body:**

```json
{
  "title": "Short, descriptive title",
  "description": "Detailed description of the issue, including steps to reproduce.",
  "reasoning": "The AI's reasoning for creating this ticket.",
  "suggested_priority": "high" | "medium" | "low",
  "dependencies": ["issue-id-1", "issue-id-2"]
}
```

**Response:**

`201 Created` with the new issue object.

#### `GET /api/v1/issues`

List issues. Can be filtered by status, assignee, etc.

**Query Parameters:**

*   `status`: `open`, `in_progress`, `in_review`, `closed`
*   `assignee`: `agent-id` or `user-id`
*   `priority`: `high`, `medium`, `low`

**Response:**

`200 OK` with an array of issue objects.

#### `GET /api/v1/issues/{issue_id}`

Get a single issue.

**Response:**

`200 OK` with the issue object.

#### `PUT /api/v1/issues/{issue_id}`

Update an issue. This is for making changes to the issue itself, not for submitting a solution.

**Request Body:**

```json
{
  "title": "Updated title",
  "description": "Updated description.",
  "reasoning": "The AI's reasoning for the update."
}
```

**Response:**

`200 OK` with the updated issue object.

#### `POST /api/v1/issues/{issue_id}/propose_change`

Propose a change to resolve the issue. This will put the issue into an `in_review` state.

**Request Body:**

```json
{
  "comment": "A summary of the proposed change.",
  "reasoning": "The AI's reasoning for this specific solution.",
  "changes": [
    {
      "file_path": "src/main.js",
      "type": "replace",
      "start_line": 10,
      "end_line": 12,
      "new_content": "..."
    }
  ]
}
```

**Response:**

`202 Accepted`

#### `DELETE /api/v1/issues/{issue_id}`

This endpoint is not available to AI agents to prevent accidental deletion. Issues should be closed, not deleted.

---

### Comments

#### `POST /api/v1/issues/{issue_id}/comments`

Add a comment to an issue. Useful for asking for clarification or providing updates.

**Request Body:**
```json
{
  "comment": "The text of the comment."
}
```

**Response:**
`201 Created`
