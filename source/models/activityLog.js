/**
 * Valid activity action types recorded in the audit log.
 * @enum {string}
 */
export const Action = Object.freeze({
  STATE_CHANGE:    "state_change",
  PRIORITY_CHANGE: "priority_change",
  EDIT:            "edit",
  READ:            "read",
  CREATION:        "creation",
  DELETION:        "deletion",
  REJECT:          "rejection",
});

/**
 * Represents a single entry in the issue activity log.
 */
export class ActivityLog {
  /**
   * @param {object} [fields]
   * @param {number|null} [fields.logId]
   * @param {number} fields.issueId
   * @param {number|null} [fields.actorId]
   * @param {string} fields.action
   * @param {string|null} [fields.details]
   * @param {string} [fields.createdAt]
   */
  constructor({
    logId     = null,
    issueId,
    actorId   = null,
    action,
    details   = null,
    createdAt = new Date().toISOString(),
  } = {}) {
    this.logId     = logId;
    this.issueId   = issueId;
    this.actorId   = actorId;
    this.action    = action;
    this.details   = details,
    this.createdAt = createdAt;
  }
}