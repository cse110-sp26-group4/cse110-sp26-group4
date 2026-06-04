// next.js
// AI was consulted for some portions of this file.
// next command for the issue tracker which allows the user to manually move the AI from issue to issue.
// usage: baton next

import {
  isTrackerReady,
  selectNextIssue,
  claimIssue,
} from '../services/issuesService.js';
import { formatTimestamp, hasFlag, renderOutput, reportTrackerNotReady, serializeIssue, wantsHelp } from '../util.js';

export const HELP = `Usage:
  baton next [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton next
`;

/**
 * Moves the AI agent to work on the next issue. 
 * Checks if the tracker is ready and if there are any open issues.
 * Prompts user to initialize the tracker if it is not ready.
 * Stats are updated on the issue through claimIssue function from init.js.
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  if (wantsHelp(args)) {
    console.log(HELP);
    return 0;
  }
  const isJson = hasFlag(args, '--json');

  if (!isTrackerReady()) {
    reportTrackerNotReady();
    return 1;
  }

  const issue = selectNextIssue();
  if (!issue) {
    renderOutput(isJson, { status: 'success', issue: null }, () => {
      console.log('No open issues available. All work is complete or the backlog is empty.');
    });
    return 0;
  }

  const updated = claimIssue(issue.id);
  const envelope = { status: 'success', issue: serializeIssue(updated) };

  renderOutput(isJson, envelope, () => {
    console.log('Working on next issue:');
    console.log(`  ID:          #${updated.id}`);
    console.log(`  Title:       ${updated.title}`);
    console.log(`  Priority:    ${updated.priority}`);
    console.log(`  Status:      ${updated.status}`);
    console.log(`  Attempts:    ${updated.attemptNum}`);
    console.log(`  Created:     ${formatTimestamp(updated.createdAt)}`);
    if (updated.description) {
      console.log(`  Description: ${updated.description}`);
    }
  });

  return 0;
}
