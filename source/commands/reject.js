// reject.js
// supports rejecting an issue.
// 
// AI Was used in generating this file.
// Usage:
//   baton reject <id> [options]
//
// Options:
//   --reason <text>        Reason for rejection (required)
//   --json                 Output in JSON format
//   -h, --help             Show this help
//
// Examples:
//   baton reject 5 --reason "Needs more detail"

import { rejectIssue, getIssue } from '../services/issuesService.js';
import { Status } from '../models/issue.js';
import { renderOutput, renderError, serializeIssue, COMMON_FLAGS, parseAndValidateArgs } from '../util.js';

export const HELP = `Usage:
    baton reject <id> [options]

Options:
    --reason <text>        Reason for rejection (required)
    --json                 Output in JSON format
    -h, --help             Show this help

Examples:
    baton reject 5 --reason "Needs more detail"
`;

export const SPEC = {
  positionals: { min: 1, max: 1 },
  flags: { '--reason': { type: 'string' }, ...COMMON_FLAGS }
};

/**
 * Rejects an issue for a specified ID.
 * 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    try {
        const { positionals, flags } = parseAndValidateArgs(args, SPEC);
        if (flags['--help']) {
            console.log(HELP);
            return 0;
        }
        const isJson = flags['--json'] ?? false;
        const idStr = positionals[0];
        const id = Number(idStr);
        const reasonText = flags['--reason'];

        if (!Number.isInteger(id) || id <= 0) {
            const err = new Error(`Invalid ID "${idStr}". ID must be a positive integer.`);
            err.code = 'INVALID_ID';
            throw err;
        }

        if (reasonText === undefined) {
            throw new Error("Missing reason for reject.");
        }
        
        if (reasonText.trim() === "") {
            throw new Error("Reason for rejection cannot be empty.");
        }
        
        let issue;
        try {
            issue = await getIssue(id);
        } catch (e) {
            const err = new Error(e.message);
            err.code = 'NOT_FOUND';
            throw err;
        }

        if (issue.status !== Status.IN_REVIEW) {
            const err = new Error(`Issue #${id} is currently "${issue.status}". Only issues in "${Status.IN_REVIEW}" status can be rejected.`);
            err.code = 'INVALID_STATE';
            throw err;
        }

        const updatedIssue = await rejectIssue(id, reasonText);
        const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

        renderOutput(isJson, envelope, () => {
            console.log(`Issue #${id} rejected successfully and moved back to "${updatedIssue.status}".`);
        });

        return 0;
    } catch (error) {
        const isJson = args.includes('--json');
        renderError(isJson, error.message, error.code || 'ERROR');
        return 1;
    }
}
