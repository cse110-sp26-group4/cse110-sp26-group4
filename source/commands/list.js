// list.js
// AI was consulted for some portions of this file.
// list command which allows the user to view a list of issues matching the filter flags
// Usage: baton list [--status <s>] [--priority <p>] [--limit <n>] [--offset <n>]
//
// Options:
//  --status <s>      Filter by status: open | in-progress | closed
//  --priority <p>    Filter by priority: low | medium | high
//  --limit <n>       Max results (default: 50)
//  --offset <n>      Skip first n results (default: 0)
//  --assignee <name> Filter by assignee name
//  --json            Output as JSON (for AI agents)
//  -h, --help        Show this help

import { listIssues } from '../services/issuesService.js';
import { issueSchema } from '../models/schema.js';
import { listAgents, getAgentByName } from '../services/agentsService.js';

import {
    getFlagValue,
    getNumericFlag,
    hasFlag,
    parseArgs,
    printIssueTable,
    printTableHeader,
    renderOutput,
    serializeIssue,
    wantsHelp,
} from '../util.js';

export const HELP = `Usage:
    baton list [--status <s>] [--priority <p>] [--limit <n>] [--offset <n>] [--json]

Options:
    --status <s>          Filter by status: open | in-progress | closed
    --priority <p>        Filter by priority: low | medium | high
    --limit <n>           Max results (default: 50)
    --offset <n>          Skip first n results (default: 0)
    --json                Output as JSON (for AI agents)
    -h, --help            Show this help

Examples:
    baton list
    baton list --status open --priority high
    baton list --limit 10 --offset 20
`;

const ALLOWED_LIST_FIELDS = ['status', 'priority', 'limit', 'offset', 'assigneeId'];

const VALID_FLAGS = new Set([
  ...ALLOWED_LIST_FIELDS.map(key => issueSchema[key].flag),
  '--json',
]);

/**
 * Lists issues matching the filters and pagination settings 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */

export async function run(args) {
    if (wantsHelp(args)) {
        console.log(HELP);
        return 0;
    }
    const isJson = hasFlag(args, '--json');
    for (const arg of args) {
        if (arg.startsWith('--') && !VALID_FLAGS.has(arg)) {
            throw new Error(`Unknown flag provided: ${arg}.\nFlags: ${[...VALID_FLAGS].join(', ')}`);
        }
    }

    try {
        const options = parseArgs(args);

        // Getting agent name from ID
        if (options.assigneeId) {
            const target = getAgentByName(options.assigneeId);
            if (!target) {
            const agents = listAgents();
            const names = agents.map(agent => `${agent.name} (${agent.type})`).join(', ');
            throw new Error(`Agent/User "${options.assigneeId}" is not registered.\nRegistered agents: ${names}`);
            }
            options.assigneeId = target.id;
        }

        const result = await listIssues(options);
        const issues = result.map(serializeIssue);
        const envelope = { status: 'success', count: issues.length, issues };

        renderOutput(isJson, envelope, (data) => {
            if (data.count === 0) {
                console.log('No issues matching those filters were found.');
                return;
            }

            const activeFilters = Object.entries(options)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');

            const filterLog = activeFilters ? `matching filters: [${activeFilters}]` : 'with no filters applied';
            console.log(`\nFound ${data.count} issue(s) ${filterLog}.`);
            console.log('');

            printTableHeader();
            result.forEach((issue) => printIssueTable(issue));
            console.log('');
        });

        return 0;
    } catch (error) {
        // Separate error message for missing value
        if (error.message.includes('Missing value')) {
            console.error(`Usage Error: ${error.message}`);
        } else {
            console.error("Error: Failed to retrieve data.");
            console.error(error.message);
        }
        return 1;
    }
}