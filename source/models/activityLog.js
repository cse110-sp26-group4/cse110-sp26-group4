export const Action = Object.freeze({
  STATE_CHANGE: "state_change",
  PRIORITY_CHANGE: "priority_change",
  EDIT: "edit",
  READ: "read",
  CREATION: "creation",
  DELETION: "deletion",
  REJECT: "rejection",
});

export class ActivityLog {
  constructor({
    log_id = null,
    id, // The issue that was addressed
    action,
    created_at = new Date().toISOString(),
  } = {}) {
    this.log_id = log_id;
    this.id = id;
    this.action = action;
    this.created_at = created_at;
  }
}
