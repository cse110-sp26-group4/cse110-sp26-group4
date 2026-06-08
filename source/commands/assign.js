// commands/assign.js
// assign command for the issue tracker
// usage: baton assign <id> <agent-name> [--json]
// AI was consulted for a portion of this file

import { getAgentByName } from '../services/agentsService.js';
import { assignIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/context.js';
import { COMMON_FLAGS, renderOutput, renderError, parseAndValidateArgs } from '../util.js';

export const HELP = `Usage:
  baton assign <id> <agent-name> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton assign 5 claude-dev
  baton assign 5 claude-dev --json
`;

export const SPEC = { positionals: { min: 2, max: 2 }, flags: { ...COMMON_FLAGS } };

/**
 * Runs the assign command to associate an issue with a registered agent.
 * Usage: baton assign <id> <agent-name> [--json]
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  try {
    const { positionals, flags } = parseAndValidateArgs(args, SPEC);
    if (flags['--help']) {
      console.log(HELP);
      return 0;
    }
    const isJson = flags['--json'] ?? false;
    const [issueIdStr, agentName] = positionals;
    
    const issueId = Number(issueIdStr);
    if (!Number.isInteger(issueId) || issueId <= 0) {
      const err = new Error(`Invalid issue ID "${issueIdStr}". Must be a positive integer.`);
      err.code = 'INVALID_ID';
      throw err;
    }

    const actor = getCurrentActor();
    if (!actor) {
      const err = new Error('No authenticated context found.');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    const target = getAgentByName(agentName);
    if (!target) {
      const err = new Error(`Agent/User "${agentName}" is not registered.`);
      err.code = 'NOT_FOUND';
      throw err;
    }

    const issue = assignIssue(issueId, target.id);

    renderOutput(isJson, { status: 'success', issueId: issue.id, assignee: { id: target.id, name: target.name, type: target.type } }, () => {
      console.log(`Success: Issue #${issueId} assigned to "${agentName}"`);
    });
    
    return 0;
  } catch (error) {
    const isJson = args.includes('--json');
    let code = error.code || 'ERROR';
    if (error.message.includes('not found')) {
      code = 'NOT_FOUND';
    }
    renderError(isJson, error.message, code);
    return 1;
  }
}