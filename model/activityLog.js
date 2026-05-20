export const Action = Object.freeze({
  // Lifecycle
  CREATED:          "created",
  CLOSED:           "closed",
  REOPENED:         "reopened",
  // Field mutations
  STATUS_CHANGED:   "status_changed",
  PRIORITY_CHANGED: "priority_changed",
  TITLE_CHANGED:    "title_changed",
  BODY_CHANGED:     "body_changed",
  // Assignment / labels
  ASSIGNED:         "assigned",
  UNASSIGNED:       "unassigned",
  LABEL_ADDED:      "label_added",
  LABEL_REMOVED:    "label_removed",
  // Collaboration
  COMMENTED:        "commented",
});

export class ActivityLog {
  constructor({
    id        = null,
    issueId,
    action,
    actor     = "system",
    metadata  = null,
    createdAt = new Date().toISOString(),
  } = {}) {
    this.id        = id;
    this.issueId   = issueId;
    this.action    = action;
    this.actor     = actor;
    this.metadata  = metadata;
    this.createdAt = createdAt;
  }
}