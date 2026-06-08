// AI was consulted for some portions of this file.
// priority.js
// Sets the priority of an issue.
// Usage: baton priority <id> <priority>
//
// Options:
//  -h, --help             Show this help
//  --json                 Output as JSON (for AI agents)
//
// Examples:
//  baton priority 5 high
//  baton priority 3 low

import { Priority } from '../models/issue.js';
import { setPriority } from '../services/issuesService.js';
import { COMMON_FLAGS, renderOutput, renderError, serializeIssue, parseAndValidateArgs } from '../util.js';

export const HELP = `Usage:
  baton priority <id> <priority>

Options:
  -h, --help             Show this help
  --json                 Output as JSON (for AI agents)

Examples:
  baton priority 5 high
  baton priority 3 low
`;

export const SPEC = { positionals: { min: 2, max: 2 }, flags: { ...COMMON_FLAGS } };

/**
 * Sets the priority of an issue.
 * @param {string[]} args - The command line arguments.
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
    const [idStr, priorityRaw] = positionals;

    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
      const err = new Error(`Invalid ID "${idStr}". ID must be a positive integer.`);
      err.code = 'INVALID_ID';
      throw err;
    }

    const values = Object.values(Priority);
    const priority = values.find((v) => v.toLowerCase() === priorityRaw.trim().toLowerCase());

    if (!priority) {
      const err = new Error(
        `Invalid priority "${priorityRaw}". Must be one of: ${values.join(', ')}.`
      );
      err.code = 'INVALID_INPUT';
      throw err;
    }

    const issue = setPriority(id, priority);
    const envelope = { status: 'success', issue: serializeIssue(issue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Issue #${issue.id} priority set to ${issue.priority}.`);
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
