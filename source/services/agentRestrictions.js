// agentRestrictions.js 

const AGENT_RESTRICTED_COMMANDS = new Set(['init', 'approve', 'reject', 'delete', 'priority']);
const AGENT_RESTRICTED_FLAGS = new Set(['--status', '--token-limit', '--assignee']);

/**
 * Validates whether an actor has permission to execute a given command and arguments.
 * @param {string} command - The primary CLI command name.
 * @param {string[]} [args=[]] - The command line arguments.
 * @throws {Error} If the agent entered a restricted command or flag
 */
export function authorizeAction(command, args = []) {
  if (AGENT_RESTRICTED_COMMANDS.has(command)) {
    throw new Error(`Command "${command}" is restricted to human users only.`);
  }

  if (command === 'update') {
    const usedRestricted = args.filter(arg => AGENT_RESTRICTED_FLAGS.has(arg));
    if (usedRestricted.length > 0) {
      throw new Error(
        `Agents cannot update parameters: ${usedRestricted.join(', ')}. ` +
        `Use 'baton claim', 'baton submit', or 'baton unclaim' for status changes.`
      );
    }
  }
}