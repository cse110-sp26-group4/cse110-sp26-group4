# Data Model

This document outlines the core data structures for the issue tracking system.

## Ticket

The central object in the system.

```
{
  "id": "string", // Unique identifier (e.g., TICKET-123)
  "title": "string",
  "description": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "creator_id": "string", // user or agent id
  "assignee_id": "string", // user or agent id
  "status": "open" | "in_progress" | "in_review" | "closed",
  "priority": "high" | "medium" | "low",
  "points": "number", // Optional, for story points
  "dependencies": ["string"], // Array of ticket ids
  "category": "string" // Optional, for repo-access restriction
}
```

## User

A human user.

```
{
  "id": "string",
  "name": "string",
  "email": "string",
  "skills": ["string"] // e.g., "frontend", "database"
}
```

## Agent

An AI agent.

```
{
  "id": "string",
  "name": "string",
  "type": "string", // e.g., "gpt-4", "claude-3"
  "status": "active" | "retired",
  "performance_metrics": {
    "tickets_closed": "number",
    "avg_resolution_time": "duration",
    "rejection_rate": "float"
  }
}
```

## Activity

An entry in the activity log.

```
{
  "id": "string",
  "ticket_id": "string",
  "timestamp": "datetime",
  "actor_id": "string", // user or agent id
  "action": "string",
  "details": "object"
}
```

## Chat Message

A message in the chat system.

```
{
  "id": "string",
  "ticket_id": "string", // Optional, for ticket-specific chats
  "timestamp": "datetime",
  "sender_id": "string", // user or agent id
  "content": "string"
}
```
