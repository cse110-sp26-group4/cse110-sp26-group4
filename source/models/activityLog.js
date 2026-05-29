export const Action = Object.freeze({
  STATE_CHANGE:    "state_change",
  PRIORITY_CHANGE: "priority_change",
  EDIT:            "edit",
  READ:            "read",
  CREATION:        "creation",
  DELETION:        "deletion",
  REJECT:          "rejection", 
});

export class ActivityLog {
  constructor({
    logId     = null,
    issueId,
    action,
    createdAt = new Date().toISOString(),
  } = {}) {
    this.logId     = logId;
    this.issueId   = issueId;
    this.action    = action;
    this.createdAt = createdAt;
  }
}