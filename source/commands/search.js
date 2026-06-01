// search.js
// AI was consulted for some portions of this file.
// search command which allows the user to search for issues by keywords (case insensitive).
// Usage: baton search "login bug"

import { searchIssues } from "../services/issuesService.js";
import {
  hasFlag,
  printIssueTable,
  printTableHeader,
  renderOutput,
  serializeIssue,
} from '../util.js';

/**
 * Searches for a title or description matching the command line argument
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args) {
    const isJson = hasFlag(args, '--json');
    const queryArgs = args.filter((arg) => arg !== '--json');

    if (queryArgs.length === 0 || queryArgs === '') {
        throw new Error("Invalid input: No search term entered.\nUsage: baton search <query>");
    }

    try {
        const query = queryArgs.join(' ');
        const result = await searchIssues(query);
        const issues = result.map(serializeIssue);
        const envelope = { status: 'success', count: issues.length, issues };

        renderOutput(isJson, envelope, (data) => {
            if (data.count === 0) {
                console.log(`No issues containing "${query}" were found.`);
                return;
            }

            console.log(`\nFound ${data.count} issue(s) containing "${query}":\n`);
            printTableHeader();
            result.forEach((issue) => printIssueTable(issue));
            console.log('');
        });

        return 0;
    } catch (error) {
        // Failed to query database
        console.error("Error: Failed to retrieve data.");
        console.error(error.message);
        return 1;
    }
} 

