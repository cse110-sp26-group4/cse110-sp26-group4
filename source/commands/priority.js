// AI was consulted for some portions of this file.
// priority.js
// Sets the priority of an issue.
// Usage: baton priority <id> <priority>
//
// Options:
//  -h, --help             Show this help
//
// Examples:
//  baton priority 5 high
//  baton priority 3 low

import { Priority } from '../models/issue.js';
import { setPriority } from '../services/issuesService.js';
import { wantsHelp } from '../util.js';

const HELP = `Usage:
  baton priority <id> <priority>

Options:
  -h, --help             Show this help

Examples:
  baton priority 5 high
  baton priority 3 low
`;

/**
 * Normalize CLI priority input to a canonical Priority enum value.
 * @param {string} input
 * @returns {string | null}
 */
function normalizePriority(input) {
  const values = Object.values(Priority);
  return values.find((v) => v.toLowerCase() === input.trim().toLowerCase()) ?? null;
}

/**
 * Sets the priority of an issue.
 * @param {string[]} args - The command line arguments.
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
  if (wantsHelp(args)) {
    console.log(HELP);
    return 0;
  }

  if (args.length < 2) {
    throw new Error(
      'Invalid input: Missing issue ID or priority.\nUsage: baton priority <id> <priority>'
    );
  }

  if (args.length > 2) {
    throw new Error(
      'Invalid input: Too many arguments.\nUsage: baton priority <id> <priority>'
    );
  }

  for (const arg of args) {
    if (arg.startsWith('--')) {
      throw new Error(
        'Unknown flag provided.\nUsage: baton priority <id> <priority>\nPriority: low | medium | high'
      );
    }
  }

  const id = parseInt(args[0], 10);
  if (Number.isNaN(id)) {
    throw new Error(
      'Invalid input: ID must be a number.\nUsage: baton priority <id> <priority>'
    );
  }

  const priority = normalizePriority(args[1]);
  if (!priority) {
    throw new Error(
      `Invalid priority "${args[1]}". Must be one of: low, medium, high.\nUsage: baton priority <id> <priority>`
    );
  }

  try {
    const issue = setPriority(id, priority);
    console.log(`Issue #${issue.id} priority set to ${issue.priority}.`);
    return 0;
  } catch (error) {
    console.error('Error: Failed to set issue priority.');
    console.error(error.message);
    return 1;
  }
}
