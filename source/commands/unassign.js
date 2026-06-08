// unassign.js
// AI was consulted to generate the majority of the contents of this file.
// However, a human has reviewed and editted the generated code.
// Removes the current assignee from an issue.
//
// Usage:
//   baton unassign <id> [--json]
//
// Examples:
//   baton unassign 12
//   baton unassign 12 --json

import { getIssue, unassignIssue } from "../services/issuesService.js";
import { getCurrentActor } from "../services/context.js";
import { AgentType } from "../models/agents.js";
import { COMMON_FLAGS, parseAndValidateArgs, renderOutput, renderError, serializeIssue } from "../util.js";

export const HELP = `Usage:
  baton unassign <id> [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton unassign 12
  baton unassign 12 --json
`;

export const SPEC = { positionals: { min: 1, max: 1 }, flags: { ...COMMON_FLAGS } };

/**
 * Removes the current assignee from an issue.
 * @param {string[]} args - The command-line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  const { positionals, flags } = parseAndValidateArgs(args, SPEC);
  if (flags['--help']) {
    console.log(HELP);
    return 0;
  }
  const isJson = flags['--json'];
  const issueId = Number(positionals[0]);

  if (!Number.isInteger(issueId) || issueId <= 0) {
    renderError(
      isJson,
      `Invalid ID "${positionals[0]}". ID must be a positive integer.`,
      "INVALID_ID",
    );
    return 1;
  }

  const actor = getCurrentActor();

  if (!actor || actor.type !== AgentType.HUMAN) {
    renderError(isJson, "Only human users can unassign issues.", "FORBIDDEN");
    return 1;
  }
  
  let issue;

  try {
    issue = getIssue(issueId);
  } catch (error) {
    if (error.message.includes("not found")) {
      renderError(isJson, error.message, "NOT_FOUND");
    } else {
      renderError(isJson, error.message);
    }
    return 1;
  }

  if (!issue.assigneeId) {
    renderError(
      isJson,
      `Issue #${issueId} is not assigned.`,
      "INVALID_STATE"
    );
    return 1;
  }

  try {
    // Use unassignIssue from issuesService.js
    const updatedIssue = unassignIssue(issueId);

    const envelope = {
      status: "success",
      issue: serializeIssue(updatedIssue),
    };

    renderOutput(isJson, envelope, () => {
      console.log(`Success: Issue #${issueId} is now unassigned.`);
    });

    return 0;
  } catch (error) {
    renderError(isJson, error.message);
    return 1;
  }
}