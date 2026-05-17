# Sprint Dashboard

The sprint dashboard provides a high-level overview of the current sprint's progress.

## Key Metrics

*   **Sprint Burndown:** A chart showing the remaining work (in story points or number of issues) over time.
*   **Velocity:** The average amount of work completed in past sprints.
*   **Issue Breakdown:** Pie charts or bar graphs showing the distribution of issues by:
    *   Status (`open`, `in_progress`, `in_review`, `closed`)
    *   Priority (`high`, `medium`, `low`)
    *   Assignee (human and AI)
*   **Overdue Issues:** A list of issues that have passed their estimated completion time.

## Dashboard Layout (CLI)

The CLI dashboard will be a text-based representation of these metrics.

```
$ issue-tracker dashboard

--- Sprint 2 (Ends: 2026-05-24) ---

Burndown:
  100 |
   80 |    /````
   60 |   /
   40 |__/
   20 |
    0 +---------------->
      Day 1  ...  Day 7

Velocity: 35 points/sprint

Issues:
  - By Status: [O] 5 | [P] 3 | [R] 1 | [C] 10
  - By Priority: [H] 2 | [M] 10 | [L] 7

Overdue:
  - TICKET-115 (3 days overdue)
```

## Dashboard Layout (GUI)

The GUI dashboard will have rich, interactive charts and graphs.
