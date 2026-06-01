// delete.js
// supports deleting an issue.
// Usage:
//   baton delete <id> [--yes]
//
// Options:
//   --yes   Skip confirmation prompt
//   -h, --help   Show this help
//
// Examples:
//   baton delete 4
//   baton delete 4 --yes

import { deleteIssue } from '../services/issuesService.js';
import { hasFlag, wantsHelp } from '../util.js';
import { confirm } from '@inquirer/prompts';

const USAGE = "Usage: baton delete <id> [options]\n\nOptions:\n  --yes        Skip confirmation prompt\n  -h, --help   Show this help";
const VALID_FLAGS = new Set(['--yes', '--help', '-h']);
const MAX_ARGS = 3; // <id>, --yes, --help

/**
 * Deletes an issue for a specified ID.
 * 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {

    // (0) Help check
    if (wantsHelp(args)) {
        console.log(USAGE);
        return 0;
    }

    // (1) Parse arguments
    if (args.length === 0) {
        console.error(`Error: No ID provided.\n${USAGE}`);
        return 1;
    }

    if (args.length > MAX_ARGS) {
        console.error(`Error: Too many arguments. Are you sure all of them are valid?\n${USAGE}`);
        return 1;
    }

    const id = Number(args[0]);
    if (!Number.isInteger(id)) { // check id is valid
        console.error(`Error: Invalid ID "${args[0]}". ID must be an integer.\n${USAGE}`);
        return 1;
    }

    for (let i = 1; i < args.length; i++) { // check all args are valid
        const arg = args[i];
        if (!VALID_FLAGS.has(arg)) { // invalid flag
            if(arg.startsWith('-')) {
                console.error(`Error: Unknown flag ${arg}.`)
            } else {
                console.error(`Error: Unknown argument ${arg}.`)
            }
            return 1;
        }
    }

    const isYes = hasFlag(args, "--yes"); 

    // (2) Confirmation prompt
    let confirmed = isYes;
    if (!confirmed) {
        try {
            confirmed = await confirm({ message: `Are you sure you want to delete issue #${id}?`, default: false });
        } catch {
            return 1;
        }
    }

    if (!confirmed) {
        console.log("Deletion cancelled.");
        return 0;
    }

    // (3) Execution
    try {
        deleteIssue(id);
        console.log(`Issue #${id} deleted successfully.`);
        return 0;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return 1;
    }
}
