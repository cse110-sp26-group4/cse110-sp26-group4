// approve.js
// AI was (regrettably) consulted for some portions of this file.
// approve command which allows a user to approve an issue currently under review.
// Usage: baton approve <id>

import { approveIssue, getIssue } from '../services/issuesService.js';
import { Status } from '../models/issue.js';
import { hasFlag, renderOutput, serializeIssue, wantsHelp } from '../util.js';

export const HELP = `Usage:
    baton approve <id> [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton approve 5
`;

/**
 * Approves an issue and moves it to the closed state.
 * @param {string[]} args - the command line arguments.
 * @returns {Promise<number>} the exit code: 0 is success, 1 is error
 */
export async function run(args) {
    if (wantsHelp(args)) {
        console.log(HELP);
        return 0;
    }
    const isJson = hasFlag(args, '--json');
    const idArgs = args.filter((arg) => arg !== '--json');

    //check if id argument is empty
    if (idArgs.length == 0) {
        throw new Error(
            'Invalid input: Missing issue ID.\nUsage: baton approve <id>'
        );
    }

    const id = idArgs.join(' ');

    //check if ID argument isn't a number
    if (isNaN(id)) {
        throw new Error(
            'Invalid input: ID must be a number.\nUsage: baton approve <id>'
        );
    }

    // Verify the issue exists and is in-review before approving
    let existing;
    try {
        existing = await getIssue(id);
    } catch (error) {
        console.error('Error: Failed to approve issue.');
        console.error(error.message);
        return 1;
    }

    if (existing.status !== Status.IN_REVIEW) {
        console.error('Error: Failed to approve issue.');
        console.error(`Issue #${existing.id} is currently "${existing.status}". Only issues in "${Status.IN_REVIEW}" status can be approved.`);
        return 1;
    }

  //try to approve the issue
    try {
        const issue = await approveIssue(id);
        const envelope = { status: 'success', issue: serializeIssue(issue) };

        renderOutput(isJson, envelope, () => {
            console.log(
                `Issue #${issue.id} approved and moved to ${issue.status}.`
            );
        });

        return 0;
    } catch (error) {
        console.error('Error: Failed to approve issue.');
        console.error(error.message);
        return 1;
    }
}
