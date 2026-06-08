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
import { COMMON_FLAGS, parseAndValidateArgs, renderOutput, renderError } from '../util.js';
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

export const SPEC = {
  positionals: { min: 1, max: 1 },
  flags: { '--yes': { type: 'boolean' }, ...COMMON_FLAGS }
};

/**
 * Deletes an issue for a specified ID.
 * 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    try {
        const { positionals, flags } = parseAndValidateArgs(args, SPEC);
        if (flags['--help']) {
            console.log(HELP);
            return 0;
        }
        const isJson = flags['--json'];
        const skipConfirm = flags['--yes'];
        const idStr = positionals[0];
        const id = Number(idStr);

        if (!Number.isInteger(id) || id <= 0) {
            const err = new Error(`Invalid ID "${idStr}". ID must be a positive integer.`);
            err.code = 'INVALID_ID';
            throw err;
        }

        await getIssue(id);

        let confirmed = skipConfirm;
        if (!confirmed && !isJson) {
            try {
                confirmed = await confirm({ message: `Are you sure you want to delete issue #${id}?`, default: false });
            } catch {
                return 1;
            }
        } else if (!confirmed && isJson) {
            throw new Error("Confirmation required. Use --yes to confirm deletion in JSON mode.");
        }

        if (!confirmed) {
            console.log("Deletion cancelled.");
            return 0;
        }

        await deleteIssue(id);
        
        const envelope = { status: 'success', id: id, message: `Issue #${id} deleted successfully.` };
        renderOutput(isJson, envelope, () => {
            console.log(`Issue #${id} deleted successfully.`);
        });
        
        return 0;
    } catch (error) {
        const isJson = args.includes('--json');
        let code = 'ERROR';
        if (error.message.includes('Confirmation required')) {
            code = 'CONFIRMATION_REQUIRED';
        } else if (error.message.includes('not found')) {
            code = 'NOT_FOUND';
        }
        renderError(isJson, error.message, code);
        return 1;
    }
}
