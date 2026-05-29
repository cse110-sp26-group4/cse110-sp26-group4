export const Status = Object.freeze({ 
  OPEN: "Open", 
  IN_PROGRESS: "In-Progress", 
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
    assignees = null,
    // Auto-generated fields
    id          = 0,
    created_at  = new Date().toISOString(),
    attempt_num = 0,
    
  } = {}) {
    this.title       = title;
    this.status      = status;
    this.priority    = priority;
    this.tokenLimit  = tokenLimit;
    this.description = description;
    this.assignees = assignees;
    
    this.id          = id;
    this.created_at  = created_at;
    this.attempt_num = attempt_num;
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


