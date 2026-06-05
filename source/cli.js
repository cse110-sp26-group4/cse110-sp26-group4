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
import * as initCmd from './commands/init.js';
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

const bold = "\x1b[1m";
const reset = "\x1b[0m";
const HELP = `
${bold}Baton — AI agent issue tracker CLI${reset}

${bold}USAGE${reset}
  baton <command> [options]

${bold}CORE & SETUP${reset}
  init       Initialize storage and seed issues from product specs
  register   Register a new AI agent or human user
  agents     List all registered agents and humans

${bold}ISSUE WORKFLOW${reset}
  create     Create an issue with specified fields
  claim      Claim an issue as the authenticated agent
  submit     Submit finished work for human review
  approve    Move an issue from in-review to closed
  reject     Reject an issue with a given reason
  update     Update an issue's specified fields
  priority   Set an issue's priority level
  delete     Delete an issue

${bold}QUERY & VIEW${reset}
  list       List issues filtered by status and priority
  search     Search issues by title and description (case insensitive)
  view       View all issue fields for a given issue ID
  status     Show issue counts and overall progress
  log        Show activity history for an issue

${bold}GLOBAL OPTIONS${reset}
  --json     Output raw JSON instead of formatted text (for AI agents)
  --help     Show detailed usage and flags for a specific command

${bold}EXAMPLES${reset}
  # Initialize the database with custom specs
  baton init --specs ./docs/requirements.md

  # Create a high priority issue and allocate a token budget
  baton create --title "Refactor auth" --priority high --token-limit 4000

  # Search for open issues and pass the output to an AI agent
  baton list --status open --json
  
  # Learn more about a specific command's options
  baton update --help
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
