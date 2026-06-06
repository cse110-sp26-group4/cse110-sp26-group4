// AI was consulted for some portions of this file.
// log.js
// log command which displays the full activity history for an issue
// Usage: baton log <id>
//
// Options:
//   -h, --help    Show this help
//   --json        Output as JSON (for AI agents)
//
// Examples:
//   baton log 5

import { getActivityLog } from '../services/issuesService.js';
import { formatTimestamp, hasFlag, wantsHelp } from '../util.js';

export const HELP = `Usage:
  baton log <id> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton log 5
`;

/**
 * Serializes an activity log entry for JSON output.
 * @param {object} entry
 * @returns {object}
 */
function serializeLogEntry(entry) {
  return {
    log_id: entry.logId,
    issue_id: entry.issueId,
    actor_id: entry.actorId,
    action: entry.action,
    details: entry.details,
    created_at: entry.createdAt,
  };
}

/**
 * Displays the full activity history for a given issue ID.
 * @param {string[]} args - The issue ID
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
  if (wantsHelp(args)) {
    console.log(HELP);
    return 0;
  }
  const isJson = hasFlag(args, '--json');
  const idArgs = args.filter((arg) => arg !== '--json');

  if (idArgs.length === 0) {
    throw new Error('Invalid input: Missing Issue ID.\nUsage: baton log <id>');
  }

  const id = idArgs.join(' ');

  if (isNaN(id)) {
    throw new Error('Invalid input: ID must be a number.\nUsage: baton log <id>');
  }

  try {
    const logs = getActivityLog(Number(id));
    const entries = logs.map(serializeLogEntry);
    const envelope = {
      status: 'success',
      issue_id: Number(id),
      count: entries.length,
      entries,
    };

    if (isJson) {
      console.log(JSON.stringify(envelope, null, 2));
      return 0;
    }

    if (entries.length === 0) {
      console.log(`No activity history for issue #${id}.`);
      return 0;
    }

    console.log(`Activity log for issue #${id}`);
    console.log('──────────────────────────────────────────');
    for (const entry of entries) {
      const timestamp = formatTimestamp(entry.created_at);
      const details = entry.details ?? '';
      console.log(`${timestamp}  ${entry.action}  ${details}`);
    }
    console.log('');

    return 0;
  } catch (error) {
    console.error('Error: Failed to retrieve activity log.');
    console.error(error.message);
    return 1;
  }
}
