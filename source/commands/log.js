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
import { COMMON_FLAGS, formatTimestamp, parseAndValidateArgs, renderError, renderOutput } from '../util.js';

export const HELP = `Usage:
  baton log <id> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton log 5
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

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

    const logs = getActivityLog(id);
    const entries = logs.map(serializeLogEntry);
    const envelope = {
      status: 'success',
      issue_id: Number(id),
      count: entries.length,
      entries,
    };

    renderOutput(isJson, envelope, () => {
      if (entries.length === 0) {
        console.log(`No activity history for issue #${id}.`);
        return;
      }

      console.log(`Activity log for issue #${id}`);
      console.log('──────────────────────────────────────────');
      for (const entry of entries) {
        const timestamp = formatTimestamp(entry.created_at);
        const details = entry.details ?? '';
        console.log(`${timestamp}  ${entry.action}  ${details}`);
      }
      console.log('');
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
