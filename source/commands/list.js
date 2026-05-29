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
        const options = {
            status: getFlagValue(args, '--status'),
            priority: getFlagValue(args, '--priority'),
            limit: getNumericFlag(args, '--limit'),
            offset: getNumericFlag(args, '--offset')
        };

        const result = await listIssues(options);

        if (result.length == 0) {
            console.log("No issues matching those filters were found.");
            return 0;
        } else {
           //Logic for table formatting
            const activeFilters = Object.entries(options)
                .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                .map(([key, value]) => `${key.replace('--', '')}: ${value}`)
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

// Helper function 
/**
 * Helper function used to format and print Issues in a table
 * @param {Object} issue 
 * @param {Object} width
 * @returns {void}
 */
function printIssueTable(issue, width) {
  const idVal = String(issue.id).substring(0, width.id);
  
  let titleVal = String(issue.title || `Issue #${issue.id}`);
  if (titleVal.length > width.title) {
    titleVal = titleVal.substring(0, width.title - 3) + "...";
  }

  const statusVal = String(issue.status || "Open");
  const priorityVal = String(issue.priority || "Low");
  let descVal = String(issue.description || "N/A");
  if (descVal.length > width.description) {
    descVal = descVal.substring(0, width.description - 3) + "...";
  }

  let row = idVal.padEnd(width.id) + " │ "
          + titleVal.padEnd(width.title) + " │ "
          + statusVal.padEnd(width.status) + " │ "      
          + priorityVal.padEnd(width.priority) + " │ "   
          + descVal.padEnd(width.description);

  console.log(row);
}