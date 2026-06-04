import os from 'os';
import { getAgentByName } from './agentsService.js';
import { setActiveActor } from './issuesService.js';

let currentActor = null;

/**
 * Authenticates the current execution context.
 * Looks for BATON_AGENT in the environment, falling back to the OS username.
 * If the agent/user is registered, it sets them as the active actor for this session.
 * If not, it terminates the process with a helpful error message.
 * @param {string} command - The command being executed
 */
export function authenticateContext(command) {
  // Commands that don't require an active agent signed in
  const exemptCommands = ['init', 'register', 'help'];
  if (exemptCommands.includes(command)) {
    return;
  }

  // Identify who is running the CLI
  const activeName = process.env.BATON_AGENT || os.userInfo().username;
  
  try {
    // Look them up in the database
    const agent = getAgentByName(activeName);

    if (!agent) {
      console.error(`Error: Agent/User "${activeName}" is not registered in this Baton tracker.`);
      console.error(`Please run 'baton register --name "${activeName}" --type "human"' (or "agent") first.`);
      process.exit(1);
    }

    // Set the global state for the remainder of this command's lifecycle
    currentActor = agent;
    setActiveActor(agent.id);
  } catch (error) {
    // Gracefully handle the scenario where the database hasn't been initialized yet
    if (error.message && error.message.includes('no such table: agents')) {
      console.error("Error: Tracker is not initialized. Please run 'baton init' first.");
      process.exit(1);
    }
    
    // Rethrow if it's a completely different error
    throw error;
  }
}

/**
 * Returns the authenticated actor object for this session.
 * @returns {object|null}
 */
export function getCurrentActor() {
  return currentActor;
}