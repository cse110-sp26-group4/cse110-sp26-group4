// loop.js
// AI was consulted for some portions of this file.
// loop command for the tracker which allows the user to make the AI agent work on the issues for a number of steps automatically.
// usage: baton loop [options]
// options:
//   --steps <n>: number of steps to run (default: 1)
//   -n <n>: alias for --steps <n>
//   <n>: same as --steps <n>
// examples usage of steps flag:
//  baton loop --steps 5
//  baton loop -n 5

/* global console */

/**
 * Important import: isTrackerReady is needed to check if the tracker is ready.
 */
import { isTrackerReady } from './init.js';
import { run as runNext } from './next.js';

/**
 * Parses the flags in the command line argument
 * @param {string[]} args - The command line arguments
 */
function parseFlags(args) {
  const stepsFlag = getNumericFlag(args, '--steps') ?? getNumericFlag(args, '-n');
  return { steps: stepsFlag ?? 1 };
}

/**
 * Gets the value of a numeric flag that outlines the number of steps the agent should work on automatically.
 * @param {string[]} args - The command line arguments
 * @param {string} flag - The flag to get the value of
 * @returns {number | null} The value of the flag
 */
function getNumericFlag(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return null;
  }
  const value = Number.parseInt(args[index + 1], 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Runs the loop command.
 * @param {string[]} args - The command line arguments
 * @returns {number} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  const { steps } = parseFlags(args);

  if (!isTrackerReady()) {
    console.error('Error: No tracker found in this directory.');
    console.error('Run `baton init` first.');
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
