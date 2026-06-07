/**
 * Valid issue status values.
 * Transition order: Open → In-Progress → In-Review → Closed.
 * @enum {string}
 */
export const Status = Object.freeze({
  OPEN: "Open",
  IN_PROGRESS: "In-Progress",
  IN_REVIEW: "In-Review",
  CLOSED: "Closed"
});

/**
 * Valid issue priority values.
 * @enum {string}
 */
export const Priority = Object.freeze({
  LOW:    "Low",
  MEDIUM: "Medium",
  HIGH:   "High",
});

/**
 * Represents a single issue in the tracker.
 */
export class Issue {
  /**
   * @param {object} [fields]
   * @param {string} [fields.title]
   * @param {string} [fields.status]
   * @param {string} [fields.priority]
   * @param {number|null} [fields.tokenLimit]
   * @param {string|null} [fields.description]
   * @param {string} [fields.lastUpdated]
   * @param {number|null} [fields.assigneeId]
   * @param {number} [fields.id]
   * @param {string} [fields.createdAt]
   * @param {number} [fields.attemptNum]
   */
  constructor({
    // User fields
    title       = "Issue #",
    status      = Status.OPEN,
    priority    = Priority.LOW,
    tokenLimit  = null,
    description = null,
    lastUpdated = new Date().toISOString(),
    assigneeId  = null,
    // Auto-generated fields
    id          = 0,
    createdAt  = new Date().toISOString(),
    attemptNum = 0,
  } = {}) {
    this.title       = title;
    this.status      = status;
    this.priority    = priority;
    this.tokenLimit  = tokenLimit;
    this.description = description;
    this.lastUpdated = lastUpdated;
    this.assigneeId  = assigneeId;
    this.id          = id;
    this.createdAt  = createdAt;
    this.attemptNum = attemptNum;
  }

  
  /**
  * Validates the issue fields based on project business rules.
  * @returns {{isValid: boolean, errors: string[]}} boolean and an array of errors
  */
  validate(){
    const errors = [];

    if (!this.title || typeof this.title !== "string" || this.title.trim() === ""){
      errors.push("Title cannot be empty");
    }

    if (!Object.values(Status).includes(this.status)) {
      errors.push(`Invalid status "${this.status}". Must be one of: ${Object.values(Status).join(", ")}`)
    }

    if (!Object.values(Priority).includes(this.priority)) {
      errors.push(`Invalid priority "${this.priority}". Must be one of: ${Object.values(Priority).join(", ")}`)
    }

    if (this.tokenLimit != null){
      const tokenLim = Number(this.tokenLimit);
      if (isNaN(tokenLim) || tokenLim <= 0){
        errors.push("tokenLimit must be positive");
      }
    }

    return {isValid: errors.length == 0, errors: errors}
  }
}
