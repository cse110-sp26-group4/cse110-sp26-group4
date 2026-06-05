import os from 'os';
import { getAgentByName } from './agentsService.js';
import { setCurrentActor, getCurrentActor } from './context.js';
import { isTrackerReady } from './issuesService.js';

export { getCurrentActor };

/**
 * Authenticates the current execution context.
 * Looks for BATON_AGENT in the environment, falling back to the OS username.
 * If the agent/user is registered, it sets them as the active actor for this session.
 * If not, it terminates the process with a helpful error message.
 * @param {string} command - The command being executed
 */
export function authenticateContext(command) {
  const AGENT_RESTRICTED_COMMANDS = ['init', 'approve', 'reject', 'delete', 'priority'];
  const AGENT_RESTRICTED_UPDATE_FLAGS = ['--status', '--token-limit'];

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

  if (agent.type === 'agent' && AGENT_RESTRICTED_COMMANDS.includes(command)) {
    console.error(`Error: Command "${command}" is restricted to human users only.`);
    process.exit(1);
  }

  // Restricts agent from using specific flags in baton update
  if (agent.type === 'agent' && command === 'update') {
    const usedRestricted = AGENT_RESTRICTED_UPDATE_FLAGS.filter(f => process.argv.includes(f));
    if (usedRestricted.length > 0) {
      console.error(`Error: Agents cannot update: ${usedRestricted.join(', ')}. Use 'baton claim', 'baton submit', or 'baton unclaim' for status changes.`);
      process.exit(1);
    }
  }

  setCurrentActor(agent);
}