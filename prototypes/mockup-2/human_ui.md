# Human User Interface

While the primary interaction for humans is the CLI, a supplementary web-based graphical user interface (GUI) is necessary for certain tasks, especially for reviewing and managing tickets created by AI.

## Key Features

*   **Ticket Dashboard:** A filterable and searchable list of all tickets.
    *   Easily distinguish between tickets created by humans and AI.
    *   See the status of each ticket (`open`, `in_progress`, `in_review`, `closed`).
*   **Ticket Details View:**
    *   View the full ticket description, comments, and activity history.
    *   Clearly see AI reasoning for ticket creation and proposed changes.
    *   For proposed changes, a rich diff view will be provided to easily see the code changes.
*   **CRUD Operations:** Humans can create, read, update, and delete tickets through the GUI.
*   **AI Interaction:**
    *   **Pause/Cancel:** A prominent button on any ticket actively being worked on by an AI to immediately pause its work. A further action would be to cancel and revert the AI's in-progress work.
    *   **Approve/Reject:** A clear workflow for approving or rejecting change proposals from AI agents.
*   **Agent Management:** A view to see all active AI agents, their current tasks, and their performance history.

## Mockup Sketch

```
+------------------------------------------------------------------+
| Dashboard | Agents | Chat                               | User   |
+------------------------------------------------------------------+
| Filters: [Status v] [Assignee v] [Priority v]   [Search: ______] |
+------------------------------------------------------------------+
| TICKET-123 | High | In Review | AI-GPT4 | Fix login button      |
|   | Approve | Reject |                                          |
+------------------------------------------------------------------+
| TICKET-122 | Med  | In Prog.  | AI-Claude | Refactor user model |
|   | Pause | Cancel |                                          |
+------------------------------------------------------------------+
| TICKET-121 | Low  | Open      | Human-User| Add new logo        |
+------------------------------------------------------------------+
```
