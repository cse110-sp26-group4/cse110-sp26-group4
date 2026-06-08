// claim.js
// Allows an agent to officially claim an issue to work on.
// Usage: baton claim <id> [--json]

import { isTrackerReady, claimIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/context.js';
import {
  COMMON_FLAGS,
  parseAndValidateArgs,
  renderOutput,
  renderError,
  serializeIssue,
  reportTrackerNotReady,
} from '../util.js';

export const HELP = `Usage:
    baton claim <id> [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton claim 5
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Claims an issue for the authenticated agent.
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  try {
    const { positionals, flags } = parseAndValidateArgs(args, SPEC);
    if (flags['--help']) {
        console.log(HELP);
        return 0;
    }
    const isJson = flags['--json'];
    const idStr = positionals[0];
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      const err = new Error(`Invalid ID "${idStr}". ID must be a positive integer.`);
      err.code = 'INVALID_ID';
      throw err;
    }

    if (!isTrackerReady()) {
      reportTrackerNotReady();
      return 1;
    }

    const actor = getCurrentActor();
    if (!actor) {
      const err = new Error('No authenticated actor found. Please sign in with a registered agent.');
      err.code = 'UNAUTHENTICATED';
      throw err;
    }

    if (actor.type !== 'agent') {
      const err = new Error('Only an agent may claim an issue.');
      err.code = 'FORBIDDEN';
      throw err;
    }

    const updatedIssue = claimIssue(id);
    const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${updatedIssue.id} claimed by agent "${actor.name}" and moved to ${updatedIssue.status}.`);
    });

    return 0;
  } catch (error) {
    const isJson = args.includes('--json');
    let code = error.code || 'ERROR';
    if (error.message.includes('not found')) {
      code = 'NOT_FOUND';
    } else if (error.message.includes('closed')) {
      code = 'INVALID_STATE';
    }
    renderError(isJson, error.message, code);
    return 1;
  }
}
