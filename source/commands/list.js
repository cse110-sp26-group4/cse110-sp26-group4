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
//  -h, --help        Show this help

import { listIssues } from '../services/issuesService.js';
import { getFlagValue, getNumericFlag } from '../util.js';
import { parseArgs, printIssueTable } from '../util.js';

// Column widths for displaying the results
const WIDTHS = {
  id: 5,
  title: 20,
  status: 15,
  priority: 10,
  description: 60
};

/**
 * Lists issues matching the filters and pagination settings 
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */

export async function run(args) {
    const validFlags = ['--status', '--priority', '--limit', '--offset'];
    // Check if user misspelled a flag
    for (const arg of args) {
        if (arg.startsWith('--')) {
            if (!validFlags.includes(arg)) {
                throw new Error(`Unknown flag provided: ${arg}. \nFlags: --status <s>, --priority <p>, --limit <n>, --offset <n>`);
            }
        }
    }

    try {
        const options = parseArgs(args);

        const result = await listIssues(options);

        if (result.length == 0) {
            console.log("No issues matching those filters were found.");
            return 0;
        } else {
           //Logic for table formatting
            const activeFilters = Object.entries(options)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');

            const filterLog = activeFilters ? `matching filters: [${activeFilters}]` : "with no filters applied";
            console.log(`\nFound ${result.length} issue(s) ${filterLog}.`);
            console.log("");
            console.log(
                "ID".padEnd(WIDTHS.id) + " │ " 
                + "TITLE".padEnd(WIDTHS.title) + " │ " 
                + "STATUS".padEnd(WIDTHS.status) + " │ " 
                + "PRIORITY".padEnd(WIDTHS.priority) + " │ " 
                + "DESCRIPTION".padEnd(WIDTHS.description)
            );

            console.log(
                "─".repeat(WIDTHS.id) + "─┼─" 
                + "─".repeat(WIDTHS.title) + "─┼─" 
                + "─".repeat(WIDTHS.status) + "─┼─" 
                + "─".repeat(WIDTHS.priority) + "─┼─" 
                + "─".repeat(WIDTHS.description)
            );

            result.forEach(issue => printIssueTable(issue, WIDTHS));

            console.log("");
            return 0;
        }

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