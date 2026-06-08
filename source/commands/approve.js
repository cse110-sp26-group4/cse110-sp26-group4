// approve.js
// AI was (regrettably) consulted for some portions of this file.
// approve command which allows a user to approve an issue currently under review.
// Usage: baton approve <id>

import { approveIssue, getIssue } from '../services/issuesService.js';
import { Status } from '../models/issue.js';
import { COMMON_FLAGS, parseAndValidateArgs, renderOutput, renderError, serializeIssue } from '../util.js';

export const HELP = `Usage:
    baton approve <id> [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton approve 5
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Approves an issue and moves it to the closed state.
 * @param {string[]} args - the command line arguments.
 * @returns {Promise<number>} the exit code: 0 is success, 1 is error
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

        const issue = getIssue(id);
        if (issue.status !== Status.IN_REVIEW) {
          const err = new Error(`Issue #${id} is currently "${issue.status}". Only issues in "${Status.IN_REVIEW}" status can be approved.`);
          err.code = 'INVALID_STATE';
          throw err;
        }

        await approveIssue(id);
        const envelope = { status: 'success', issue: serializeIssue(issue) };

        renderOutput(isJson, envelope, () => {
            console.log(
                `Issue #${issue.id} approved and moved to ${Status.CLOSED}.`
            );
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
