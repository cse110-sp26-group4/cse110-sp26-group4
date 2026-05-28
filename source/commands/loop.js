// loop.js
// AI was consulted for some portions of this file.
// loop command for the tracker which allows the AI agent to work autonomously for multiple steps.
// usage: baton loop [options]
// options:
//   --steps <n>: number of steps to run (default: 1)
//   -n <n>: alias for --steps <n>
//   <n>: same as --steps <n>
// examples usage of steps flag:
//  baton loop --steps 5
//  baton loop -n 5

import { isTrackerReady } from '../services/issuesService.js';
import { getNumericFlag, reportTrackerNotReady } from '../util.js';
import { run as runNext } from './next.js';

/**
 * Parses the flags in the command line argument
 * @param {string[]} args - The command line arguments
 * @returns {{ steps: number }}
 */
function parseLoopFlags(args) {
  const stepsFlag = getNumericFlag(args, '--steps') ?? getNumericFlag(args, '-n');
  return { steps: stepsFlag ?? 1 };
}

/**
 * Runs the loop command
 * @param {string[]} args
 * @returns {Promise<number>}
 */
export async function run(args = []) {
  const { steps } = parseLoopFlags(args);

  if (!isTrackerReady()) {
    reportTrackerNotReady();
    return 1;
  }

  if (!Number.isInteger(steps) || steps < 1) {
    console.error('Error: --steps must be a positive integer.');
    console.error('Usage: baton loop --steps <n>');
    return 1;
  }

  console.log(`Running baton for ${steps} step(s)...\n`);

  let completed = 0;
  for (let step = 1; step <= steps; step += 1) {
    console.log(`--- Step ${step}/${steps} ---`);
    const code = await runNext();
    if (code !== 0) {
      return code;
    }
    completed += 1;
    if (step < steps) {
      console.log('');
    }
  }

  console.log(`\nCompleted ${completed} autonomous step(s).`);
  return 0;
}
