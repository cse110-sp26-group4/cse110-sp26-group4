// status.js
// AI was consulted for some portions of this file.
// status command for the issue tracker which allows the user to see the status of the tracker.
// usage: baton status

import {
  isTrackerReady,
  getIssueStats,
  getAllIssues,
} from '../services/issuesService.js';
import { reportTrackerNotReady } from '../util.js';

/**
 * Main function that runs the status command.
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run() {
  if (!isTrackerReady()) {
    reportTrackerNotReady();
    return 1;
  }

  const stats = getIssueStats();
  const issues = getAllIssues();
  let progress;
  if (stats.total === 0) {
    progress = 0;
  } else {
    progress = Math.round((stats.closed / stats.total) * 100);
  }

  console.log('Issue Tracker Status');
  console.log('──────────────────────────────────────────');
  console.log(`Total issues:     ${stats.total}`);
  console.log(`Open:             ${stats.open}`);
  console.log(`In progress:      ${stats.inProgress}`);
  console.log(`In review:        ${stats.inReview}`);
  console.log(`Closed:           ${stats.closed}`);
  console.log(`Overall progress: ${progress}% complete`);

  if (issues.length > 0) {
    console.log('\nOpen issues by priority:');
    const byPriority = { High: 0, Medium: 0, Low: 0 };
    for (const issue of issues) {
      if (issue.status === 'Open') {
        byPriority[issue.priority] += 1;
      }
    }
    console.log(`  High:   ${byPriority.High}`);
    console.log(`  Medium: ${byPriority.Medium}`);
    console.log(`  Low:    ${byPriority.Low}`);
  }

  return 0;
}
