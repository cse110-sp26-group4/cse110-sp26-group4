#!/usr/bin/env node
// cli.js
// AI was consulted for large portions of this file.
// CLI for the issue tracker which allows the user to interact with the tracker.
// usage: baton [command] [options]
// commands:
//   init: initialize the tracker
//   status: show issue counts and overall progress
//
// see each command's file for more detailed flags specifications.
/**
 * Imports the run functions from each command.
 */
import { run as runInit } from './commands/init.js';
import { run as runStatus } from './commands/status.js';
import { run as runApprove } from './commands/approve.js';
import { run as runReject } from './commands/reject.js';
import { wantsHelp } from './util.js';
import { run as runView} from './commands/view.js';
import { run as runSearch } from './commands/search.js';
import { run as runList } from './commands/list.js';
import { run as runCreate } from './commands/create.js'
import { run as runUpdate } from './commands/update.js';
import { run as runDelete } from './commands/delete.js';
import { run as runPriority } from './commands/priority.js';
import { run as runLog } from './commands/log.js';
import { run as runRegister } from './commands/register.js';
import { run as runAgents } from './commands/agents.js';
import { run as runSubmit } from './commands/submit.js';

import { authenticateContext } from './services/authService.js';

const HELP = `baton — AI agent issue tracker CLI

Usage:
  baton <command> [options]

Commands:
  init     Initialize storage and seed issues from product specs
  register Register a new AI agent or human user
  agents   List all registered agents and humans
  status   Show issue counts and overall progress
  view     View all issue fields for a given issue ID
  search   Search issues by title and description (case insensitive)
  list     Lists issues filtered by status and priority
  create   Creates an issue with specified fields
  approve  Move an issue from in-review to closed
  submit   Submit finished work for human review
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

  if (!command || command === 'help' || wantsHelp(args) || command === '--help') {
    console.log(HELP);
    process.exit(command ? 0 : 1);
    return;
  }

  // Authenticate the user and context before executing any command.
  authenticateContext(command);

  const handlers = {
    init: () => runInit(args),
    register: () => runRegister(args),
    agents: () => runAgents(args),
    status: () => runStatus(args),
    view: () => runView(args),
    search: () => runSearch(args),
    list: () => runList(args),
    approve: () => runApprove(args),
    reject: () => runReject(args),
    priority: () => runPriority(args),
    create: () => runCreate(args),
    update: () => runUpdate(args),
    delete: () => runDelete(args),
    log: () => runLog(args),
    submit: () => runSubmit(args),
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
