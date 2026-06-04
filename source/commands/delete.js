// delete.js
// supports deleting an issue.
// 
// AI was used to modify this file to support JSON outputs.
// 
// Usage:
//   baton delete <id> [--yes] [--json]
//
// Options:
//   --yes        Skip confirmation prompt
//   --json       Output in JSON format
//   -h, --help   Show this help
//
// Examples:
//   baton delete 4
//   baton delete 4 --yes

import { deleteIssue, getIssue } from '../services/issuesService.js';
import { hasFlag, wantsHelp, renderOutput, renderError } from '../util.js';
import { confirm } from '@inquirer/prompts';

export const HELP = `Usage:
    baton delete <id> [--yes] [--json]

Options:
    --yes                 Skip confirmation prompt
    --json                Output as JSON (for AI agents)
    -h, --help            Show this help

Examples:
    baton delete 4
    baton delete 4 --yes
`;

/**
 * Deletes an issue for a specified ID.
 * 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    const isJson = hasFlag(args, '--json');

    // (0) Help check
    if (wantsHelp(args)) {
        console.log(HELP);
        return 0;
    }

    // (1) Parse arguments
    const idArgs = args.filter(arg => !arg.startsWith('-'));
    if (idArgs.length === 0) {
        renderError(isJson, `No ID provided.\n${HELP}`, 'MISSING_ID');
        return 1;
    }

    const id = Number(idArgs[0]);
    if (!Number.isInteger(id)) {
        renderError(isJson, `Invalid ID "${idArgs[0]}". ID must be an integer.`, 'INVALID_ID');
        return 1;
    }

    const isYes = hasFlag(args, "--yes");

    try {
        // (2) Check if issue exists before confirming
        try {
            await getIssue(id);
        } catch (error) {
            if (error.message.includes("not found")) {
                renderError(isJson, error.message, 'NOT_FOUND');
            } else {
                renderError(isJson, error.message);
            }
            return 1;
        }

        // (3) Confirmation prompt
        let confirmed = isYes;
        if (!confirmed && !isJson) { // Only prompt if not JSON and not --yes
            try {
                confirmed = await confirm({ message: `Are you sure you want to delete issue #${id}?`, default: false });
            } catch {
                return 1;
            }
        } else if (!confirmed && isJson) {
            // In JSON mode, do not prompt. If --yes is missing, we fail or assume no.
            renderError(isJson, "Confirmation required. Use --yes to confirm deletion in JSON mode.", 'CONFIRMATION_REQUIRED');
            return 1;
        }

        if (!confirmed) {
            console.log("Deletion cancelled.");
            return 0;
        }

        // (4) Execution
        await deleteIssue(id);
        
        const envelope = { status: 'success', id: id, message: `Issue #${id} deleted successfully.` };
        renderOutput(isJson, envelope, () => {
            console.log(`Issue #${id} deleted successfully.`);
        });
        
        return 0;
    } catch (error) {
        renderError(isJson, error.message);
        return 1;
    }
}
