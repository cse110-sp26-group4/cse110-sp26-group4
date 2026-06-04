// claim.js
// Allows an agent to officially claim an issue to work on.
// Usage: baton claim <id> [--json]

import { isTrackerReady, claimIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/authService.js';
import {
  hasFlag,
  renderOutput,
  renderError,
  getFirstPositionalArg,
  serializeIssue,
  reportTrackerNotReady,
} from '../util.js';

/**
 * Claims an issue for the authenticated agent.
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  const isJson = hasFlag(args, '--json');

  if (hasFlag(args, '-h') || hasFlag(args, '--help')) {
    console.log(`Usage: baton claim <id> [--json]\n\nOptions:\n  --json                 Output as JSON (for AI agents)\n  -h, --help             Show this help\n\nExamples:\n  baton claim 14`);
    return 0;
  }

  const idArg = getFirstPositionalArg(args, { ignoreFlags: ['--json'] });

  if (!idArg) {
    renderError(isJson, 'Missing issue ID.\nUsage: baton claim <id>', 'MISSING_ID');
    return 1;
  }

  const id = Number(idArg);
  if (!Number.isInteger(id)) {
    renderError(isJson, `Invalid ID "${idArg}". ID must be an integer.`, 'INVALID_ID');
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
