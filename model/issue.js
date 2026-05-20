export const Status = Object.freeze({
  BACKLOG:     "backlog",
  READY:       "ready",
  IN_PROGRESS: "in_progress",
  IN_REVIEW:   "in_review",
  DONE:        "done"
});

export const Priority = Object.freeze({
  NONE:   null,
  LOW:    "low",
  MEDIUM: "medium",
  HIGH:   "high",
  URGENT: "urgent",
});

export const Type = Object.freeze({
    NONE: null,
    BUG: "bug",
    FEATURE: "feature",
    TASK: "task"
})




export class Issue {
  constructor({
    id        = null,
    title,
    body      = null,
    status    = Status.BACKLOG,
    type      = Type.NONE,
    priority  = Priority.NONE,
    assignee  = [],
    participants = [],
    labels    = [],
    milestone = null,
    relationships = {},
    development = null,
    createdAt = new Date().toISOString(),
    closedAt  = null,
  } = {}) {
    this.id        = id;
    this.title     = title;
    this.body      = body;
    this.status    = status;
    this.type      = type;
    this.priority  = priority;
    this.assignee  = assignee;
    this.participants = participants;
    this.labels    = labels;
    this.milestone = milestone;
    this.relationships = relationships;
    this.development = development;
    this.createdAt = createdAt;
    this.closedAt  = closedAt;
  }
}