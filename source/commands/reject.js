// reject.js
// supports rejecting an issue.
// Usage:
//   baton reject <id> [options]
//
// Options:
//   --reason <text>        Reason for rejection (required)
//   -h, --help             Show this help
//
// Examples:
//   baton reject 5 --reason "Needs more detail"

import { rejectIssue } from '../services/issuesService.js';
import { hasFlag, getFlagValue, wantsHelp } from '../util.js';
import { confirm } from '@inquirer/prompts';

const USAGE = "Usage:\n  baton reject <id> [options]\n\nOptions:\n  --reason <text>        Reason for rejection (required)\n  -h, --help   Show this help";
const VALID_FLAGS = new Set(['--reason', '--help', '-h']);
const MAX_ARGS = 3; // <id>, --reason, --help

/**
 * Rejects an issue for a specified ID.
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

    let i = 1;
    while (i < args.length) { // validate args
        const flag = args[i];
        if (!flag.startsWith('-')) {
            console.error(`Error: Expected a flag, instead got positional argument ${flag}.\n${USAGE}`);
            return 1;
        }
        if (!VALID_FLAGS.has(flag)) { // invalid flag
            console.error(`Error: Unknown flag ${flag}.`);
            return 1;
        }

        i += 1; // move to positional args, if any

        switch (flag) {
            case "--reason":
                i += 1;
        }
    }

    // required flags
    if (!hasFlag(args, "--reason")) {
        console.error(`Error: Missing reason for reject.\n${USAGE}`);
        return 1;
    }
    const reasonText = getFlagValue(args, "--reason");
    
    try {
        rejectIssue(id, reasonText);
        console.log(`Issue #${id} rejected successfully.`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return 1;
    }
}