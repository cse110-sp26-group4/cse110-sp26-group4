#!/usr/bin/env node
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
import * as initCmd from './commands/init.js';
import * as nextCmd from './commands/next.js';
import * as loopCmd from './commands/loop.js';
import * as statusCmd from './commands/status.js';
import * as approveCmd from './commands/approve.js';
import * as rejectCmd from './commands/reject.js';
import * as viewCmd from './commands/view.js';
import * as searchCmd from './commands/search.js';
import * as listCmd from './commands/list.js';
import * as createCmd from './commands/create.js';
import * as updateCmd from './commands/update.js';
import * as deleteCmd from './commands/delete.js';
import * as priorityCmd from './commands/priority.js';
import * as logCmd from './commands/log.js';
import * as registerCmd from './commands/register.js';
import * as agentsCmd from './commands/agents.js';
import * as submitCmd from './commands/submit.js';
import * as claimCmd from './commands/claim.js';

import { wantsHelp } from './util.js';

import { authenticateContext } from './services/authService.js';

const HELP = `baton — AI agent issue tracker CLI

Usage:
  baton <command> [options]

Commands:
  init     Initialize storage and seed issues from product specs
  register Register a new AI agent or human user
  agents   List all registered agents and humans
  next     Work on the highest-priority open issue
  loop     Run the agent autonomously for multiple steps
  status   Show issue counts and overall progress
  view     View all issue fields for a given issue ID
  search   Search issues by title and description (case insensitive)
  list     Lists issues filtered by status and priority
  create   Creates an issue with specified fields
  approve  Move an issue from in-review to closed
  submit   Submit finished work for human review
  claim    Claim an issue as the authenticated agent
  priority Set an issue's priority level
  update   Updates an issue's specified fields
  delete   Deletes an issue
  log      Show activity history for an issue

Options:
  init --force                    Re-initialize an existing tracker database
  init --specs <path>             Path to product specs file (overrides default)
  init --json                     Output as JSON (for AI agents)
  init <path>                     Same as --specs <path> (positional)
  Default specs: docs/specs/project-requirements.md
  register --name <name>          Name of the agent or user
  register --type <type>          agent | human (default: agent)
  agents [--json]
  loop --steps <n>                Number of autonomous steps (alias: -n)
  loop -n <n>
  loop --json                     Output as JSON (for AI agents)
  next --json                     Output as JSON (for AI agents)
  status --json                   Output as JSON (for AI agents)
  view <id> [--json]
  search <query> [--json]
  list --status <s>               Filter by status: open | in-progress | closed
  list --priority <p>             Filter by priority: low | medium | high
  list --limit <n>                Max results (default: 50)
  list --offset <n>               Skip first n results (default: 0)
  list --json                     Output as JSON (for AI agents)
  create --title <text>           Issue title (defaults to "Issue #<id>" if omitted)
  create --description <text>     Issue description
  create --priority <level>       low | medium | high  (default: low)
  create --token-limit <n>        Optional token budget for this issue
  create --json                   Output as JSON (for AI agents)
  approve <id> [--json]
  submit <id> [--json]
  claim <id> [--json]
  reject <id> --reason <text>     Reject an issue with a given reason
  priority <id> <level> [--json]  low | medium | high
  update --title <text>           New title
  update --description <text>     New description
  update --token-limit <n>        New token budget
  update --status <s>             open | in-progress | closed
  update --priority <level>       low | medium | high
  update --json                   Output as JSON (for AI agents)
  delete <id> [--yes]
  log <id> [--json]

Examples:
  baton init
  baton init --specs ./my-specs.md
  baton init ./my-specs.md
  baton init --force
  baton register --name claude-dev --type agent
  baton agents
  baton next
  baton loop --steps 5
  baton status
  baton view 29
  baton search system
  baton list
  baton list --status open --priority high
  baton list --limit 10 --offset 20
  baton create --title "Fix login bug" --priority high
  baton create --title "Refactor auth" --description "Clean up JWT logic" --token-limit 4000
  baton approve 5
  baton submit 14
  baton claim 14
  baton priority 5 high
  baton priority 3 low
  baton update 3 --title "Revised title"
  baton update 7 --status closed --priority medium
  baton log 5
`;

/**
 * Main function that runs the CLI.
 * @returns {Promise<void>} The exit code: 0 is success, 1 is error, 2 is invalid input.
 */
async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
    process.exit(0);
    return;
  }

  // If user requested help for a specific subcommand (e.g. `baton list -h`)
  const modules = {
    init: initCmd,
    register: registerCmd,
    agents: agentsCmd,
    next: nextCmd,
    loop: loopCmd,
    status: statusCmd,
    view: viewCmd,
    search: searchCmd,
    list: listCmd,
    approve: approveCmd,
    reject: rejectCmd,
    priority: priorityCmd,
    create: createCmd,
    update: updateCmd,
    delete: deleteCmd,
    log: logCmd,
    submit: submitCmd,
  };

  if (wantsHelp(args)) {
    const mod = modules[command];
    if (mod && mod.HELP) {
      console.log(mod.HELP);
      process.exit(0);
      return;
    }
    // Fallback to global help
    console.log(HELP);
    process.exit(0);
    return;
  }

  // Authenticate the user and context before executing any command.
  authenticateContext(command);

  const handlers = {
    init: () => initCmd.run(args),
    register: () => registerCmd.run(args),
    agents: () => agentsCmd.run(args),
    next: () => nextCmd.run(args),
    loop: () => loopCmd.run(args),
    status: () => statusCmd.run(args),
    view: () => viewCmd.run(args),
    search: () => searchCmd.run(args),
    list: () => listCmd.run(args),
    approve: () => approveCmd.run(args),
    reject: () => rejectCmd.run(args),
    claim: () => claimCmd.run(args),
    priority: () => priorityCmd.run(args),
    create: () => createCmd.run(args),
    update: () => updateCmd.run(args),
    delete: () => deleteCmd.run(args),
    log: () => logCmd.run(args),
    submit: () => submitCmd.run(args),
  };

  const handler = handlers[command];
  if (!handler) {
    if (wantsHelp(args)) {
      console.log(HELP);
      process.exit(0);
      return;
    }
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
