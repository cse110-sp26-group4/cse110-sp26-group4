# TUI Dashboard Mockup

The `issue dashboard` command launches a terminal-based graphical interface (TUI) for a high-level overview of the project status.

## Dashboard Layout (Concept)

```text
+---------------------------------------------------------------------------------+
| ISSUE TRACKER DASHBOARD                                        [ May 17, 2026 ] |
+---------------------------------------------------------------------------------+
| [ SPRINT PROGRESS ]                                                             |
| [====================----------] 65% Complete                                   |
| Open: 12 | In Progress: 5 | Awaiting Approval: 3 | Closed: 28                   |
+--------------------------+------------------------------------------------------+
| [ ACTIVE AGENTS ]        | [ URGENT TICKETS ]                                   |
| 1. Agent-01 (Working)    | #105: Critical memory leak in core. [High]           |
| 2. Agent-02 (Idle)       | #109: Database connection timeout.  [High]           |
| 3. Agent-03 (Paused)     | #112: UI alignment on mobile.       [Med]            |
+--------------------------+------------------------------------------------------+
| [ RECENT ACTIVITY ]                                                             |
| 15:10 - Agent-01 proposed fix for #105 (Reason: Leak found in cache.js)        |
| 14:45 - User 'Alice' approved #102                                              |
| 14:30 - Agent-02 started #109                                                   |
+---------------------------------------------------------------------------------+
| [ CONTROLS ]                                                                    |
| [C] Create  [L] List  [V] View  [A] Approve  [P] Pause  [R] Retire Agent  [Q] Quit |
+---------------------------------------------------------------------------------+
```

## Features
*   **Real-time Updates:** The dashboard refreshes as AI agents perform actions or humans update tickets.
*   **Approval Queue:** A dedicated section or tab to quickly review and approve/reject AI-proposed changes.
*   **Token Monitoring:** Visual indicator of token usage per sprint or per ticket.
*   **Interactive Navigation:** Use arrow keys or shortcuts (shown in [CONTROLS]) to navigate and manage tickets directly from the dashboard.

## Issue View Detail (TUI)
When selecting a ticket, the view expands:

```text
+---------------------------------------------------------------------------------+
| ISSUE #105: Critical memory leak in core.                       [Status: Open]  |
+---------------------------------------------------------------------------------+
| Priority: High | Assignee: Agent-01 | Token Limit: 10,000 | Created: 12:00      |
+---------------------------------------------------------------------------------+
| DESCRIPTION:                                                                    |
| Users report the application slows down significantly after 2 hours of use.     |
| Preliminary analysis suggests the event loop is being blocked by a large        |
| collection in the cache module.                                                 |
+---------------------------------------------------------------------------------+
| AI REASONING LOG:                                                               |
| [15:10] Agent-01: Analyzed heap dumps. Identified unpurged keys in the          |
| 'sessionCache' object. Plan: Implement a TTL (Time-To-Live) for cache entries.   |
+---------------------------------------------------------------------------------+
| ACTIVITY HISTORY:                                                               |
| 15:10 - Edit by Agent-01: Added reasoning and proposed fix.                     |
| 12:05 - Read by Agent-01                                                        |
| 12:00 - Creation by User 'Bob'                                                  |
+---------------------------------------------------------------------------------+
| [A] Approve Fix  [P] Pause Agent  [E] Edit  [D] Delete  [B] Back to Dashboard   |
+---------------------------------------------------------------------------------+
```
