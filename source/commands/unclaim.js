// unclaim.js
// Allows an agent to release an issue they have previously claimed, returning it to Open.
// The command verifies the authenticated actor is of type 'agent' and is the current assignee.
// Usage: baton unclaim <id> [--json]
//
// Options:
//   --json                 Output as JSON (for AI agents)
//   -h, --help             Show this help
//
// Examples:
//   baton unclaim 14

import { getIssue, unclaimIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/context.js';
import { AgentType } from '../models/agents.js';
import {
  COMMON_FLAGS,
  parseAndValidateArgs,
  renderOutput,
  renderError,
  serializeIssue,
} from '../util.js';

export const HELP = `Usage:
  baton unclaim <id> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton unclaim 14
  > Success: Issue #14 released by agent "claude-dev" and returned to Open.
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Releases an issue back to Open status, clearing the assignee.
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args = []) {
  try {
    const { positionals, flags } = parseAndValidateArgs(args, SPEC);
    if (flags['--help']) {
      console.log(HELP);
      return 0;
    }
    const isJson = flags['--json'] ?? false;
    const id = Number(positionals[0]);

    if (!Number.isInteger(id) || id <= 0) {
      throw new Error(`Invalid ID "${positionals[0]}". ID must be a positive integer.`);
    }

    const actor = getCurrentActor();

    if (!actor || actor.type !== AgentType.AGENT) {
      throw new Error('Only agents can unclaim issues.');
    }

    const issue = getIssue(id);

    if (issue.assigneeId !== actor.id) {
      throw new Error(`Issue #${id} is not assigned to you. Only the current assignee can unclaim an issue.`);
    }

    const updatedIssue = unclaimIssue(id);
    const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${id} released by agent "${actor.name}" and returned to Open.`);
    });

    return 0;
  } catch (error) {
    const isJson = args.includes('--json');
    let code = 'ERROR';
    if (error.message.includes('not found')) {
      code = 'NOT_FOUND';
    } else if (
      error.message.includes('not assigned to you') ||
      error.message.includes('Only agents can unclaim issues')
    ) {
      code = 'FORBIDDEN';
    }
    renderError(isJson, error.message, code);
    return 1;
  }
}
