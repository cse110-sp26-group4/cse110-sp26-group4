// update.js
// AI was consulted for some portions of this file.
// update command allows the user to update data fields for an issue 
// Usage: baton update <id> [options]
//
// Options:
//  --title <text>         New title
//  --description <text>   New description
//  --token-limit <n>      New token budget
//  --status <s>           open | in-progress | closed
//  --priority <p>         low | medium | high
//  -h, --help             Show this help
//
// Examples:
// baton update 3 --title "Revised title"
// baton update 7 --status closed --priority medium

import { updateIssue, getIssue } from "../services/issuesService.js";
import { parseArgs } from '../util.js';


/**
 * Updates the specified fields for a given issue ID 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    if (args.length === 0 || args === '') {
        throw new Error("Invalid input: No arguments entered.\nUsage: baton update <id> [options] \nOptions: --title <text>, --description <text>, --token-limit <n>, --status <s>, --priority <level>");
    } 

    // Convert id argument from string to base-10 integer
    const id = parseInt(args[0], 10);

    if (isNaN(id)) {
        throw new Error ("Invalid input: No ID entered. \nUsage: baton update <id> [options]\nOptions: --title <text>, --description <text>, --token-limit <n>, --status <s>, --priority <level>");
    }

    const validFlags = ['--title', '--description', '--token-limit', '--status', '--priority'];
    // Check if user misspelled a flag
    for (const arg of args) {
        if (arg.startsWith('--')) {
            if (!validFlags.includes(arg)) {
                throw new Error(`Unknown flag provided: ${arg}. \nFlags: --title <text>, --description <text>, --token-limit <n>, --status <s>, --priority <level>`);
            }
        }
    }

    try {
        const options = parseArgs(args.slice(1));

        // Store the old issue fields for displaying purposes:
        const oldIssue = getIssue(id);

        const newIssue = await updateIssue(id, options);

        console.log("");
        // Compare and print the changes:
        console.log(`Successfully updated issue #${id}:`);
        for (const key in options) {
            if (oldIssue[key] !== newIssue[key]) {
                console.log(`  ${key}: "${oldIssue[key]}" -> "${newIssue[key]}"`);
            } else {
                // If the entered argument matches the old data
                console.log(`  ${key}: No change (already set to "${newIssue[key]}")`);
            }
        }
        console.log("");
        return 0;
    } catch (error) {
        console.error(`Failed to update issue: ${error.message}`);
        return 1;
    }
}