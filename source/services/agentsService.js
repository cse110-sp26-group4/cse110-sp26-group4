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

/**
 * Retrieves an agent by their unique ID.
 * @param {number} id
 * @returns {Agent|null}
 */
export function getAgentById(id) {
  const db = getDB();
  const row = db.select().from(agentsTable).where(eq(agentsTable.id, id)).get();

  if (row) {
    return new Agent(row);
  } else {
    return null;
  }
}

/**
 * Lists all registered agents and humans, ordered by id.
 * @returns {Agent[]}
 */
export function listAgents() {
  const db = getDB();
  const rows = db.select().from(agentsTable).orderBy(agentsTable.id).all();
  return rows.map((row) => new Agent(row));
}

/**
 * Resolves an agent name to their ID (case-insensitive)
 * @param {string} name
 * @returns {number} The agent's ID
 * @throws {Error} If no agent with the given name exists
 */
export function resolveAgentId(name) {
  const agents = listAgents();
  const target = agents.find(a => a.name.toLowerCase() === name.toLowerCase());

  if (!target) {
    const names = agents.map(a => `${a.name} (${a.type})`).join(', ');
    throw new Error(`Agent/User "${name}" is not registered.\nRegistered agents: ${names}`);
  }

  return target.id;
}