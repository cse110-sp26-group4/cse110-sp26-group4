// search.js
// AI was consulted for some portions of this file.
// search command which allows the user to search for issues by keywords (case insensitive).
// Usage: baton search "login bug"

import { searchIssues } from "../services/issuesService.js";
import { printIssueTable } from '../util.js';

// Column widths for displaying the results
const WIDTHS = {
  id: 5,
  title: 20,
  status: 15,
  priority: 10,
  //assignee: 10,
  description: 60
};

/**
 * Searches for a title or description matching the command line argument
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    if (args.length === 0 || args === '') {
        throw new Error("Invalid input: No search term entered.\nUsage: baton search <query>");
    }

    try {
        const query = args.join(' ');
        const result = await searchIssues(query);

        // If no issues with matching title or desc was found
        if (result.length == 0) {
            console.log(`No issues containing "${query}" were found.`);
            return 0;
        }

        console.log(`\nFound ${result.length} issue(s) containing "${query}":\n`);

        // Logic for table formatting 
        console.log(
          "ID".padEnd(WIDTHS.id) + " │ " 
          + "TITLE".padEnd(WIDTHS.title) + " │ " 
          + "STATUS".padEnd(WIDTHS.status) + " │ " 
          + "PRIORITY".padEnd(WIDTHS.priority) + " │ " 
          //+ "ASSIGNEE".padEnd(WIDTHS.assignee) + " │ "
          + "DESCRIPTION".padEnd(WIDTHS.description)
        );

        console.log(
          "─".repeat(WIDTHS.id) + "─┼─" 
          + "─".repeat(WIDTHS.title) + "─┼─" 
          + "─".repeat(WIDTHS.status) + "─┼─" 
          + "─".repeat(WIDTHS.priority) + "─┼─" 
          //+ "─".repeat(WIDTHS.assignee) + "─┼─" 
          + "─".repeat(WIDTHS.description)
        );

        result.forEach(issue => printIssueTable(issue, WIDTHS));

        console.log("");
        return 0;
    } catch (error) {
        // Failed to query database
        console.error("Error: Failed to retrieve data.");
        console.error(error.message);
        return 1;
    }
} 

