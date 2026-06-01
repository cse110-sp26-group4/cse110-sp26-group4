// create.js
// AI was consulted for some portions of this file.
// create command allows the user to create an issue 
// Usage: baton create --title <text> --description <text> --priority <level> --token-limit <n>
// 
// Examples:
// baton create --title "Fix login bug" --priority high
//  baton create --title "Refactor auth" --description "Clean up JWT logic" --token-limit 4000
// Options:
//  --title <text>         Issue title (defaults to "Issue #<id>" if omitted)
//  --description <text>   Issue description
//  --priority <level>     low | medium | high  (default: low)
//  --token-limit <n>      Optional token budget for this issue
//  -h, --help             Show this help

import { createIssue } from "../services/issuesService.js";
import { getFlagValue, getNumericFlag } from "../util.js";
import { hasFlag, parseArgs, renderOutput, serializeIssue } from '../util.js';

/**
 * Initializes a new issue in the database with the specified fields
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    const isJson = hasFlag(args, '--json');
    const validFlags = ['--title', '--description', '--priority', '--token-limit', '--json'];
    // Check if user misspelled a flag
    for (const arg of args) {
        if (arg.startsWith('--')) {
            if (!validFlags.includes(arg)) {
                throw new Error(`Unknown flag provided: ${arg}. \nFlags: --title <text>, --description <text>, --priority <level>, --token-limit <n>`);
            }
        }
    }

    try {
        const options = parseArgs(args);

        const issue = await createIssue(options);
        const envelope = { status: 'success', issue: serializeIssue(issue) };

        renderOutput(isJson, envelope, () => {
            console.log(`Successfully created issue #${issue.id}: "${issue.title}"`);
        });

        return 0;
    } catch (error) {
        console.error(`Failed to create issue: ${error.message}`);
        return 1;
    }
}