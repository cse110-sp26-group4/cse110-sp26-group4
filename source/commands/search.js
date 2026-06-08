// search.js
// AI was consulted for some portions of this file.
// search command which allows the user to search for issues by keywords (case insensitive).
// Usage: baton search "login bug"

import { searchIssues } from "../services/issuesService.js";
import {
    parseAndValidateArgs,
    printIssueTable,
    printTableHeader,
    renderOutput,
    renderError,
    serializeIssue,
    COMMON_FLAGS,
} from '../util.js';

export const HELP = `Usage:
    baton search <query> [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton search system
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Searches for a title or description matching the command line argument
 * @param {string[]} args - The command line arguments
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
        const query = positionals[0];

        const result = await searchIssues(query);
        const issues = result.map(serializeIssue);
        const envelope = { status: 'success', count: issues.length, issues };

        renderOutput(isJson, envelope, (data) => {
            if (data.count === 0) {
                console.log(`No issues containing "${query}" were found.`);
                return;
            }

            console.log(`\nFound ${data.count} issue(s) containing "${query}":\n`);
            printTableHeader();
            result.forEach((issue) => printIssueTable(issue));
            console.log('');
        });

        return 0;
    } catch (error) {
        const isJson = args.includes('--json');
        renderError(isJson, error.message);
        return 1;
    }
} 

