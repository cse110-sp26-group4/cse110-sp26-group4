import { getDB } from '../db/index.js';
import { eq } from "drizzle-orm";
import { agentsTable } from "../models/schema.js";
import { Agent } from '../models/agents.js';

/**
 * Registers a new agent in the database.
 * @param {string} name 
 * @param {string} type 
 * @returns {Agent|null}
 */
export function registerAgent(name, type) {
  const db = getDB();
  const result = db.insert(agentsTable)
    .values({ name: name, type: type })
    .returning({ id: agentsTable.id })
    .get();
  
  const row = db.select().from(agentsTable).where(eq(agentsTable.id, result.id)).get();
  
  if (row) {
    return new Agent(row);
  } else {
    return null;
  }
}

/**
 * Retrieves an agent by their unique name.
 * @param {string} name 
 * @returns {Agent|null}
 */
export function getAgentByName(name) {
  const db = getDB();
  const row = db.select().from(agentsTable).where(eq(agentsTable.name, name)).get();
  
  if (row) {
    return new Agent(row);
  } else {
    return null;
  }
}