export const Status = Object.freeze({ 
  OPEN: "Open", 
  IN_PROGRESS: "In-Progress", 
  IN_REVIEW: "In-Review",
  CLOSED: "Closed" 
});

export const Priority = Object.freeze({
  LOW:    "Low",
  MEDIUM: "Medium",
  HIGH:   "High",
});

export class Issue {
  constructor({
    // User fields
    title       = "Issue #",
    status      = Status.OPEN,
    priority    = Priority.LOW,
    tokenLimit  = null,
    description = null,
    lastUpdated = new Date().toISOString(),
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
    this.id          = id;
    this.createdAt  = createdAt;
    this.attemptNum = attemptNum;
  }
}