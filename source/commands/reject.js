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
import { hasFlag, getFlagValue, wantsHelp, renderOutput, renderError, serializeIssue, COMMON_FLAGS, parseAndValidateArgs } from '../util.js';

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
    const { positionals, flags } = parseAndValidateArgs(args, SPEC);
    if (flags['--help']) {
        console.log(HELP);
        return 0;
    }
    const isJson = flags['--json'] ?? false;
    const id = Number(positionals[0]);
    const reasonText = flags['--reason'];

    if (!Number.isInteger(id)) {
        renderError(isJson, `Invalid ID "${positionals[0]}". ID must be an integer.`, 'INVALID_ID');
        return 1;
    }

    if (!reasonText || reasonText.trim() === "") {
        renderError(isJson, "Reason for rejection cannot be empty.", 'EMPTY_REASON');
        return 1;
    }
    
    let issue;
    try {
        issue = await getIssue(id);
    } catch (error) {
        if (error.message.includes("not found")) {
            renderError(isJson, error.message, 'NOT_FOUND');
        } else {
            renderError(isJson, error.message);
        }
        return 1;
    }

    if (issue.status !== Status.IN_REVIEW) {
        renderError(isJson, `Issue #${id} is currently "${issue.status}". Only issues in "${Status.IN_REVIEW}" status can be rejected.`, 'INVALID_STATE');
        return 1;
    }

    try {
        // (3) Perform rejection
        const updatedIssue = await rejectIssue(id, reasonText);
        const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

        renderOutput(isJson, envelope, () => {
            console.log(`Issue #${id} rejected successfully and moved back to "${updatedIssue.status}".`);
        });

        return 0;
    } catch (error) {
        renderError(isJson, error.message);
        return 1;
    }
}