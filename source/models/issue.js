export const Status = Object.freeze({
  OPEN: "Open",
  IN_PROGRESS: "In-Progress",
  BLOCKED: "Blocked",
  CLOSED: "Closed",
});

export const Priority = Object.freeze({
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
});

export class Issue {
  constructor({
    // User fields
    title = "Issue #",
    status = Status.OPEN,
    priority = Priority.LOW,
    tokenLimit = null,
    description = null,
    assignee = null,
    // Auto-generated fields
    id = 0,
    created_at = new Date().toISOString(),
    attempt_num = 0,
  } = {}) {
    this.title = title;
    this.status = status;
    this.priority = priority;
    this.tokenLimit = tokenLimit;
    this.description = description;
    this.assignee = assignee; 

    this.id = id;
    this.created_at = created_at;
    this.attempt_num = attempt_num;
  }
}
