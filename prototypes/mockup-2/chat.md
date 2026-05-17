# Chat & Communication

The system will include two types of chat functionalities.

## 1. General Chat

A high-level chat interface where users can give general instructions to a primary AI assistant.

**CLI:**

```bash
issue-tracker chat "We should improve the performance of the user login flow."
```

**Workflow:**

1.  The user sends a general prompt.
2.  The primary AI assistant analyzes the prompt.
3.  The AI decomposes the prompt into one or more specific, actionable tickets.
4.  The AI creates these tickets using the `POST /api/v1/issues` endpoint.
5.  The AI responds to the user with a summary of the created tickets and asks for confirmation to assign them to other agents.

**Example AI Response:**

> "I've created the following tickets based on your request:
> *   **TICKET-124:** Benchmark the current login flow.
> *   **TICKET-125:** Optimize the database query for user authentication.
> *   **TICKET-126:** Add caching to the user session endpoint.
>
> Would you like me to assign these to available agents?"

## 2. Ticket-Specific Chat

Each ticket will have its own chat thread. This allows for focused discussions between humans and the assigned AI agent about that specific issue.

**CLI:**

```bash
issue-tracker comment TICKET-125 "Make sure to consider the impact on the session table."
```

**GUI:**

The ticket details page will have a chat interface for real-time communication.

This allows for:
*   Clarifying requirements.
*   Providing feedback on the AI's approach.
*   Getting status updates from the AI.
