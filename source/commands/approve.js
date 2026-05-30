// approve.js
// AI was (regrettably) consulted for some portions of this file.
// approve command which allows a user to approve an issue currently under review.
// Usage: baton approve <id>

import { approveIssue } from '../services/issuesService.js';

/**
 * Approves an issue and moves it to the closed state.
 * @param {string[]} args - the command line arguments.
 * @returns {Promise<number>} the exit code: 0 is success, 1 is error
 */
export async function run(args) {
    //check if id argument is empty
    if (args.length == 0) {
        throw new Error(
            'Invalid input: Missing issue ID.\nUsage: baton approve <id>'
        );
    }

    const id = args.join(' ');

    //check if ID argument isn't a number
    if (isNaN(id)) {
        throw new Error(
            'Invalid input: ID must be a number.\nUsage: baton approve <id>'
        );
    }

  //try to approve the issue
    try {
        const issue = await approveIssue(id);
        console.log(
            `Issue #${issue.id} approved and moved to ${issue.status}.`
        );

        return 0;
    } catch (error) {
        console.error('Error: Failed to approve issue.');
        console.error(error.message);
        return 1;
    }
}
