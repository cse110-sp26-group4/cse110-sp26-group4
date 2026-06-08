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
export async function run(args = []) {
    try {
        const { positionals, flags } = parseAndValidateArgs(args, SPEC);
        if (flags['--help']) {
            console.log(HELP);
            return 0;
        }
        const isJson = flags['--json'] ?? false;
        const id = positionals[0];

        // checks if ID # argument isn't a number
        if (isNaN(id)) {
            const err = new Error(`Invalid input: ID must be a number.\nUsage: baton view <id>`);
            err.code = 'INVALID_ID';
            throw err;
        }

        const issue = await getIssue(id);
        const envelope = {
            status: 'success',
            issue: serializeIssue(issue),
        };

        renderOutput(isJson, envelope, () => {
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
        const isJson = args.includes('--json');
        let code = error.code || 'ERROR';
        if (error.message.includes('not found')) {
            code = 'NOT_FOUND';
        }
        renderError(isJson, error.message, code);
        return 1;
    }
}