// unclaim.js
// Allows an agent to release an issue they have previously claimed, returning it to Open.
// The command verifies the authenticated actor is of type 'agent' and is the current assignee.
// Usage: baton unclaim <id> [--json]
//
// Options:
//   --json                 Output as JSON (for AI agents)
//   -h, --help             Show this help
//
// Examples:
//   baton unclaim 14

import { getIssue, unclaimIssue } from '../services/issuesService.js';
import { getCurrentActor } from '../services/context.js';
import { AgentType } from '../models/agents.js';
import {
  hasFlag,
  renderOutput,
  renderError,
  serializeIssue,
  wantsHelp,
} from '../util.js';

const HELP = `baton unclaim — Release a claimed issue back to Open

Usage:
  baton unclaim <id> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton unclaim 14
  > Success: Issue #14 released by agent "claude-dev" and returned to Open.
`;

/**
 * Releases an issue back to Open status, clearing the assignee.
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  if (wantsHelp(args)) {
    console.log(HELP);
    return 0;
  }

  const isJson = hasFlag(args, '--json');

  const idArgs = args.filter((arg) => !arg.startsWith('-'));
  if (idArgs.length === 0) {
    renderError(isJson, 'Missing issue ID.\nUsage: baton unclaim <id>', 'MISSING_ID');
    return 1;
  }

  const id = Number(idArgs[0]);
  if (!Number.isInteger(id) || id <= 0) {
    renderError(isJson, `Invalid ID "${idArgs[0]}". ID must be a positive integer.`, 'INVALID_ID');
    return 1;
  }

  const actor = getCurrentActor();

  if (!actor || actor.type !== AgentType.AGENT) {
    renderError(isJson, 'Only agents can unclaim issues.', 'FORBIDDEN');
    return 1;
  }

  let issue;
  try {
    issue = getIssue(id);
  } catch (error) {
    if (error.message.includes('not found')) {
      renderError(isJson, error.message, 'NOT_FOUND');
    } else {
      renderError(isJson, error.message);
    }
    return 1;
  }

  if (issue.assigneeId !== actor.id) {
    renderError(
      isJson,
      `Issue #${id} is not assigned to you. Only the current assignee can unclaim an issue.`,
      'FORBIDDEN',
    );
    return 1;
  }

  try {
    const updatedIssue = unclaimIssue(id);
    const envelope = { status: 'success', issue: serializeIssue(updatedIssue) };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${id} released by agent "${actor.name}" and returned to Open.`);
    });

    return 0;
  } catch (error) {
    renderError(isJson, error.message);
    return 1;
  }
}
