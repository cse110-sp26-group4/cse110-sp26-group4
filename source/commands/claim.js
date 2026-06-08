// claim.js
// Allows an agent to officially claim an issue to work on.
// Usage: baton claim <id> [--json]

import { isTrackerReady, claimIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/context.js';
import {
  COMMON_FLAGS,
  hasFlag,
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
  const { positionals, flags } = parseAndValidateArgs(args, SPEC);
  if (flags['--help']) {
      console.log(HELP);
      return 0;
  }
  const isJson = flags['--json'];
  const id = positionals[0];

  if (isNaN(id)) {
    renderError(isJson, `Invalid ID "${id}". ID must be a number.`, 'INVALID_ID');
    return 1;
  }

  if (!isTrackerReady()) {
    reportTrackerNotReady();
    return 1;
  }

  const actor = getCurrentActor();
  if (!actor) {
    renderError(isJson, 'No authenticated actor found. Please sign in with a registered agent.', 'UNAUTHORIZED');
    return 1;
  }

  if (actor.type !== 'agent') {
    renderError(isJson, 'Only an agent may claim an issue.', 'UNAUTHORIZED');
    return 1;
  }

  try {
    const updatedIssue = claimIssue(id);
    const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${updatedIssue.id} claimed by agent "${actor.name}" and moved to ${updatedIssue.status}.`);
    });

    return 0;
  } catch (error) {
    renderError(isJson, error.message);
    return 1;
  }
}
