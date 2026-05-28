#!/usr/bin/env node
/* global console, process */
// cli.js
// AI was consulted for large portions of this file.
// CLI for the issue tracker which allows the user to interact with the tracker.
// usage: baton [command] [options]
// commands:
//   init: initialize the tracker
//   next: work on the next issue
//   loop: run the agent autonomously for multiple steps
//   status: show issue counts and overall progress
//
// see each command's file for more detailed flags specifications.
/**
 * Imports the run functions from each command.
 */
import { run as runInit } from './commands/init.js';
import { run as runNext } from './commands/next.js';
import { run as runLoop } from './commands/loop.js';
import { run as runStatus } from './commands/status.js';
import { wantsHelp } from './util.js';
import { run as runList } from './commands/list.js';

const HELP = `baton — AI agent issue tracker CLI

Usage:
  baton <command> [options]

Commands:
  init     Initialize storage and seed issues from product specs
  next     Work on the highest-priority open issue
  loop     Run the agent autonomously for multiple steps
  status   Show issue counts and overall progress
  list     Lists issues filtered by status and priority 

Options:
  init --force              Re-initialize an existing tracker database
  init --specs <path>       Path to product specs file (overrides default)
  init <path>               Same as --specs <path> (positional)
  Default specs: docs/specs/project-requirements.md
  loop --steps <n>          Number of autonomous steps (alias: -n)
  loop -n <n>
  list --status <s>         Filter by status: open | in-progress | closed
  list --priority <p>       Filter by priority: low | medium | high
  list --limit <n>          Max results (default: 50)
  list --offset <n>         Skip first n results (default: 0)

Examples:
  baton init
  baton init --specs ./my-specs.md
  baton init ./my-specs.md
  baton init --force
  baton next
  baton loop --steps 5
  baton status
  baton list
  baton list --status open --priority high
  baton list --limit 10 --offset 20
`;

/**
 * Main function that runs the CLI.
 * @returns {Promise<void>} The exit code: 0 is success, 1 is error, 2 is invalid input.
 */
async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === 'help' || wantsHelp(args)) {
    console.log(HELP);
    process.exit(command ? 0 : 1);
    return;
  }

  const handlers = {
    init: () => runInit(args),
    next: () => runNext(args),
    loop: () => runLoop(args),
    status: () => runStatus(args),
    list: () => runList(args)
  };

  const handler = handlers[command];
  if (!handler) {
    console.error(`Error: Unknown command "${command}".`);
    console.error('Run `baton --help` for usage.');
    process.exit(1);
    return;
  }

  try {
    const exitCode = await handler();
    process.exit(exitCode ?? 0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(2);
  }
}

main();
