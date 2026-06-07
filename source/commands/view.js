// view.js
// AI was consulted for some portions of this file.
// view command which allows user to view all data fields for an issue 
// Usage: baton view <id> [--json]

import { getIssue } from '../services/issuesService.js';
import { hasFlag, renderOutput, serializeIssue } from '../util.js';

/**
 * Displays all issue fields for a given id #
 * @param {string[]} args - The issue ID #
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    const isJson = hasFlag(args, '--json');
    const idArgs = args.filter((arg) => arg !== '--json');

    // checks if id # argument is empty
    if (idArgs.length == 0) {
        throw new Error(`Invalid input: Missing Issue ID.\nUsage: baton view <id>`);
    }

    const id = idArgs.join(' ');

    // checks if ID # argument isn't a number
    if (isNaN(id)) {
        throw new Error(`Invalid input: ID must be a number.\nUsage: baton view <id>`);
    }

    try {
        const issue = await getIssue(id);
        const envelope = {
            status: 'success',
            issue: issue ? serializeIssue(issue) : null,
        };

        renderOutput(isJson, envelope, () => {
            if (!issue) {
                console.log(`No issue with ID #"${issue}" was found.`);
                return;
            }

            console.log('');
            Object.entries(issue).forEach(([key, value]) => {
                console.log(`${key}: ${value}`);
            });
            console.log('');
        });

        return 0;
    } catch (error) {
        console.error("Error: Failed to retrieve data.");
        console.error(error.message);
        return 1;
    }
}