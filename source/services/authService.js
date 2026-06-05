import os from 'os';
import { getAgentByName } from './agentsService.js';
import { setCurrentActor, getCurrentActor } from './context.js';

export { getCurrentActor };

/**
 * Authenticates the current execution context.
 * Looks for BATON_AGENT in the environment, falling back to the OS username.
 * If the agent/user is registered, it sets them as the active actor for this session.
 * If not, it terminates the process with a helpful error message.
 * @param {string} command - The command being executed
 */
export function authenticateContext(command) {
  const exemptCommands = ['init', 'register', 'help'];
  if (exemptCommands.includes(command)) {
    return;
  }

  const activeName = process.env.BATON_AGENT || os.userInfo().username;

  try {
    const agent = getAgentByName(activeName);

    if (!agent) {
      console.error(`Error: Agent/User "${activeName}" is not registered in this Baton tracker.`);
      console.error(`Please run 'baton register --name "${activeName}" --type "human"' (or "agent") first.`);
      process.exit(1);
    }

    setCurrentActor(agent);
  } catch (error) {
    if (error.message && error.message.includes('no such table: agents')) {
      console.error("Error: Tracker is not initialized. Please run 'baton init' first.");
      process.exit(1);
    }
    throw error;
  }
}