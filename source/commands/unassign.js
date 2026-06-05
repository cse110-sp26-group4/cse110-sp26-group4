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

import { unassignIssue } from "../services/issuesService.js";
import { hasFlag, renderOutput } from "../util.js";

const VALID_FLAGS = new Set(["--json"]);

/**
 * Removes the current assignee from an issue.
 * @param {string[]} args - The command-line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
  const isJson = hasFlag(args, "--json");

  // Validate flags
  const providedFlags = args.filter((a) => a.startsWith("--"));
  for (const flag of providedFlags) {
    if (!VALID_FLAGS.has(flag)) {
      throw new Error(`Unknown flag: ${flag}`);
    }
  }

  const issueId = Number(args.find((a) => !a.startsWith("-")));

  if (!Number.isInteger(issueId) || issueId <= 0) {
    console.error("Usage: baton unassign <id> [--json]");
    return 1;
  }

  try {
    // Use unassignIssue from issuesService.js
    const issue = await unassignIssue(issueId);

    renderOutput(
      isJson,
      {
        status: "success",
        issue,
      },
      () => {
        console.log(`Success: Issue #${issueId} is now unassigned.`);
      }
    );

    return 0;
  } catch (error) {
    console.error(`Failed to unassign issue: ${error.message}`);
    return 1;
  }
}