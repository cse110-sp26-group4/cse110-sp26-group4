import os from 'os';
import { getAgentByName } from './agentsService.js';
import { setCurrentActor, getCurrentActor } from './context.js';
import { isTrackerReady } from './issuesService.js';
import { authorizeAction } from './agentRestrictions.js';

export { getCurrentActor };

/**
 * Authenticates the current execution context.
 * Looks for BATON_AGENT in the environment, falling back to the OS username.
 * If the agent/user is registered, it sets them as the active actor for this session.
 * If not, it terminates the process with a helpful error message.
 * @param {string} command - The command being executed
 * @param {string[]} [args=[]] - The command line arguments.
 */
export function authenticateContext(command, args = []) {
  const exemptCommands = ['register', 'help'];
  if (exemptCommands.includes(command)) {
    return;
  }

  if (!isTrackerReady()) {
    if (command === 'init') {
      return;
    }
    console.error("Error: Tracker is not initialized. Please run 'baton init' first.");
    process.exit(1);
  }

  const activeName = process.env.BATON_AGENT || os.userInfo().username;
  const agent = getAgentByName(activeName);
    
  if (!agent) {
      console.error(`Error: Agent/User "${activeName}" is not registered in this Baton tracker.`);
      console.error(`Please run 'baton register --name "${activeName}" --type "human"' (or "agent") first.`);
      process.exit(1);
  }

  // Check if agent entered a restricted command
  if (agent.type === 'agent') {
    authorizeAction(command, args);
  }

  setCurrentActor(agent);
}