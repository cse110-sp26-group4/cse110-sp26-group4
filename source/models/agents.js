export const AgentType = Object.freeze({
  AGENT: "agent",
  HUMAN: "human"
});

export class Agent {
  constructor({
    // User fields
    name      = "Unnamed",
    type      = AgentType.AGENT,
    // Auto-generated fields
    id        = 0,
    createdAt = new Date().toISOString(),
  } = {}) {
    this.name      = name;
    this.type      = type;
    this.id        = id;
    this.createdAt = createdAt;
  }

  /**
   * Validates the agent fields based on project business rules.
   * @returns {{isValid: boolean, errors: string[]}} boolean and an array of errors
   */
  validate() {
    const errors = [];

    if (!this.name || typeof this.name !== "string" || this.name.trim() === "") {
        errors.push("Name cannot be empty");
    }

    if (!Object.values(AgentType).includes(this.type)) {
      errors.push(`Invalid type "${this.type}". Must be one of: ${Object.values(AgentType).join(", ")}`);
    }

    return { isValid: errors.length === 0, errors: errors };
  }
}