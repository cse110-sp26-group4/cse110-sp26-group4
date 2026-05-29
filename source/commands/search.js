// search.js
// AI was consulted for some portions of this file.
// search command which allows the user to search for issues by keywords (case insensitive).
// Usage: baton search "login bug"

import { searchIssues } from "../services/issuesService.js";
import { printIssueTable, printTableHeader } from '../util.js';

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
        printTableHeader();
        result.forEach(issue => printIssueTable(issue));

        console.log("");
        return 0;
    } catch (error) {
        // Failed to query database
        console.error("Error: Failed to retrieve data.");
        console.error(error.message);
        return 1;
    }
} 

