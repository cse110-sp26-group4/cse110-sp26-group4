// submit.js
// AI was consulted to generate the contents of the file. It was then reviewed and edited by a human.
// Allows an agent to submit "finished" work for human review.
// The issue must be in the in-progress status to be submitted for review.
// Usage: baton submit <id> [--json]
//
// Options:
//   --json                 Output as JSON (for AI agents)
//
// Examples:
//   baton submit 14

import { getIssue, submitForReview, getActiveActor } from '../services/issuesService.js';
import { Status } from '../models/issue.js';
import {
  hasFlag,
  renderOutput,
  renderError,
  serializeIssue,
} from '../util.js';

/**
 * Submits an in-progress issue for human review.
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  const isJson = hasFlag(args, '--json');

  const idArgs = args.filter((arg) => arg !== '--json');
  if (idArgs.length === 0) {
    renderError(isJson, 'Missing issue ID.\nUsage: baton submit <id>', 'MISSING_ID');
    return 1;
  }

  const id = Number(idArgs[0]);
  if (!Number.isInteger(id)) {
    renderError(isJson, `Invalid ID "${idArgs[0]}". ID must be an integer.`, 'INVALID_ID');
    return 1;
  }

  let issue;
  try {
    issue = getIssue(id);
  } catch (error) {
    if (error.message.includes('not found')) {
      renderError(isJson, error.message, 'NOT_FOUND');
    } else {
      renderError(isJson, error.message);
    }
    return 1;
  }

  if (issue.status !== Status.IN_PROGRESS) {
    renderError(
      isJson,
      `Issue #${id} is currently "${issue.status}". Only issues in "${Status.IN_PROGRESS}" can be submitted for review.`,
      'INVALID_STATE',
    );
    return 1;
  }

  try {
    const actorId = getActiveActor();
    if (actorId == null) {
      renderError(isJson, 'No active agent. Run baton register first.', 'NO_ACTOR');
      return 1;
    }

    const updatedIssue = submitForReview(id, actorId);
    const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${id} submitted for review.`);
    });

    return 0;
  } catch (error) {
    renderError(isJson, error.message);
    return 1;
  }
}
