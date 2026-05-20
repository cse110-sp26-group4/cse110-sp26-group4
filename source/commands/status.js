// status.js
// AI was consulted for some portions of this file.
// status command for the issue tracker which allows the user to see the status of the tracker.
// usage: baton status

/* global console */

/**
 * Imports neccessary functions from init.js to return issue stats.
 * Important import: isTrackerReady is needed to check if the tracker is ready.
 */
import { isTrackerReady, getIssueStats, getAllIssues } from './init.js';

/**
 * Main function that runs the status command.
 * @returns {number} The exit code: 0 is success, 1 is error.
 */
export async function run() {
  if (!isTrackerReady()) {
    console.error('Error: No tracker found in this directory.');
    console.error('Run `agent init` first.');
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
