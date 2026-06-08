// submit.js
// AI was consulted to generate the contents of the file. It was then reviewed and edited by a human.
// Allows an agent to submit "finished" work for human review.
// The issue must be in the in-progress status to be submitted for review.
// Usage: baton submit <id> [--json]
//
// Options:
//   --json                 Output as JSON (for AI agents)
//   -h, --help             Show this help
//
// Examples:
//   baton submit 14

import { getIssue, submitForReview } from '../services/issuesService.js';
import { Status } from '../models/issue.js';
import {
  COMMON_FLAGS,
  parseAndValidateArgs,
  renderOutput,
  renderError,
  serializeIssue,
} from '../util.js';

export const HELP = `Usage:
  baton submit <id> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton submit 14
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Submits an in-progress issue for human review.
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
    const idStr = positionals[0];
    const id = Number(idStr);

    if (!Number.isInteger(id) || id <= 0) {
      const err = new Error(`Invalid ID "${idStr}". ID must be a positive integer.`);
      err.code = 'INVALID_ID';
      throw err;
    }

    let issue;
    try {
      issue = getIssue(id);
    } catch (e) {
      const err = new Error(e.message);
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (issue.status !== Status.IN_PROGRESS) {
      const err = new Error(`Issue #${id} is currently "${issue.status}". Only issues in "${Status.IN_PROGRESS}" can be submitted for review.`);
      err.code = 'INVALID_STATE';
      throw err;
    }

    const updatedIssue = submitForReview(id);
    const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${id} submitted for review.`);
    });

    return 0;
  } catch (error) {
    const isJson = args.includes('--json');
    renderError(isJson, error.message, error.code || 'ERROR');
    return 1;
  }
}
