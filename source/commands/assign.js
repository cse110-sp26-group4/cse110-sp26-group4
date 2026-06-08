// commands/assign.js
// assign command for the issue tracker
// usage: baton assign <id> <agent-name> [--json]
// AI was consulted for a portion of this file

import { getAgentByName } from '../services/agentsService.js';
import { assignIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/authService.js';
import { hasFlag, renderOutput } from '../util.js';

export const HELP = `Usage:
  baton assign <id> <agent-name> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton assign 5 claude-dev
  baton assign 5 claude-dev --json
`;

/**
 * Runs the assign command to associate an issue with a registered agent.
 * Usage: baton assign <id> <agent-name> [--json]
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  // Check if the user requested JSON output formatting via the --json flag
  const isJson = hasFlag(args, '--json');
  
  // Strip out any flags starting with '-' to isolate the raw [issueIdStr, agentName] positional arguments
  const [issueIdStr, agentName] = args.filter(arg => !arg.startsWith('-'));

  // Guard Clause: Ensure both the issue ID and the agent name were provided
  if (!issueIdStr || !agentName) {
    console.error('Usage Error: Missing arguments.\n${HELP}\n');
    return 1;
  }

  // Convert the extracted issue ID string into a safe decimal integer
  const issueId = Number(issueIdStr);
  
  // Guard Clause: If parsing failed (e.g., the user typed letters instead of an ID), reject it
  if (!Number.isInteger(issueId) || issueId <= 0) {
    console.error(`Error: Invalid issue ID "${issueIdStr}". Must be a positive integer.\n${HELP}\n`);
    return 1;
  }

  try {
    // Look up the current operator. If null, error
    const actor = getCurrentActor() || Object.assign(new Error('No authenticated context found.'), { isAuthErr: true });
    // If that identifier property exists, it means the lookup failed; error
    if (actor.isAuthErr) throw actor;

    // Look up the target assignee by name. If not found, error
    const target = getAgentByName(agentName) || Object.assign(new Error(`Agent/User "${agentName}" is not registered.`), { isTargetErr: true });
    // If the lookup failed, throw the target error
    if (target.isTargetErr) throw target;

    // Execute the assignment in the database layer, passing the parsed ID, assignee ID, and operator ID
    const issue = assignIssue(issueId, target.id, actor.id);

    // Render the final output payload. If --json is on, it prints raw data. Otherwise, executes callback.
    renderOutput(isJson, { status: 'success', issueId: issue.id, assignee: { id: target.id, name: target.name, type: target.type } }, () => {
      console.log(`Success: Issue #${issueId} assigned to "${agentName}"`);
    });
    
    return 0; // Command completed successfully
  } catch (error) {
    // Intercepts any thrown operational error (or database crash) and outputs a clean message
    console.error(`Error: ${error.message}`);
    return 1; // Return error exit code
  }
}