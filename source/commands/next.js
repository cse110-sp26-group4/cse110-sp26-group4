// next.js
// AI was consulted for some portions of this file.
// next command for the issue tracker which allows the user to manually move the AI from issue to issue.
// usage: baton next

/* global console */

import {
  isTrackerReady,
  selectNextIssue,
  workOnIssue,
} from '../services/issuesService.js';
import { formatTimestamp, reportTrackerNotReady } from '../util.js';

/**
 * Moves the AI agent to work on the next issue. 
 * Checks if the tracker is ready and if there are any open issues.
 * Prompts user to initialize the tracker if it is not ready.
 * Stats are updated on the issue through workOnIssue function from init.js.
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run() {
  if (!isTrackerReady()) {
    reportTrackerNotReady();
    return 1;
  }

  const issue = selectNextIssue();
  if (!issue) {
    console.log('No open issues available. All work is complete or the backlog is empty.');
    return 0;
  }

  const updated = workOnIssue(issue.id);

  console.log('Working on next issue:');
  console.log(`  ID:          #${updated.id}`);
  console.log(`  Title:       ${updated.title}`);
  console.log(`  Priority:    ${updated.priority}`);
  console.log(`  Status:      ${updated.status}`);
  console.log(`  Attempts:    ${updated.attempt_num}`);
  console.log(`  Created:     ${formatTimestamp(updated.created_at)}`);
  if (updated.description) {
    console.log(`  Description: ${updated.description}`);
  }

  return 0;
}
