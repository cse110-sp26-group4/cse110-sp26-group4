// view.js
// AI was consulted for some portions of this file.
// view command which allows user to view all data fields for an issue 
// Usage: baton view <id> [--json]

import { getIssue } from '../services/issuesService.js';
import { COMMON_FLAGS, parseAndValidateArgs, renderOutput, renderError, serializeIssue, formatTimestamp } from '../util.js';

export const HELP = `Usage:
    baton view <id> [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton view 29
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Displays all issue fields for a given id #
 * @param {string[]} args - The issue ID #
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    let positionals, flags;
    try {
        const result = parseAndValidateArgs(args, SPEC);
        positionals = result.positionals;
        flags = result.flags;
    } catch (error) {
        const isJson = args.includes('--json');
        renderError(isJson, error.message);
        return 1;
    }
    if (flags['--help']) {
        console.log(HELP);
        return 0;
    }
    const isJson = flags['--json'];
    const id = positionals[0];

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
                if (key === 'createdAt' || key === 'lastUpdated') {
                    console.log(`${key}: ${formatTimestamp(value)}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
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