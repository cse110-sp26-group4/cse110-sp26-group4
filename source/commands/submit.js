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
export async function run(args) {
  let positionals, flags;
  try {
    const result = parseAndValidateArgs(args, SPEC);
    positionals = result.positionals;
    flags = result.flags;
  } catch (error) {
    const isJson = args.includes('--json');
    renderError(isJson, error.message);
    return 1;
  }
  if (flags['--help']) {
    console.log(HELP);
    return 0;
  }
  const isJson = flags['--json'];
  const id = Number(positionals[0]);

  if (!Number.isInteger(id)) {
    renderError(isJson, `Invalid ID "${positionals[0]}". ID must be an integer.`, 'INVALID_ID');
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
    const updatedIssue = submitForReview(id);
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
