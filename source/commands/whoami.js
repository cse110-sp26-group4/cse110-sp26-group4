// whoami.js
// Shows the currently authenticated agent or user.
// Usage: baton whoami [--json]
//
// Options:
//   --json                 Output as JSON (for AI agents)
//   -h, --help             Show this help
//
// Examples:
//   baton whoami

import { getCurrentActor } from '../services/authService.js';
import { hasFlag, renderOutput, renderError, wantsHelp, validateFlags } from '../util.js';


export const HELP = `Usage:
    baton whoami [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton whoami
`;

/**
 * Serializes the authenticated actor for JSON output.
 * @param {object} actor
 * @returns {object}
 */
function serializeActor(actor) {
  return {
    id: actor.id,
    name: actor.name,
    type: actor.type,
  };
}

/**
 * Displays the currently authenticated agent or user.
 * @param {string[]} [args]
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  const isJson = hasFlag(args, '--json');

  if (wantsHelp(args)) {
    console.log(
      `Usage: baton whoami [--json]\n\nOptions:\n  --json                 Output as JSON (for AI agents)\n  -h, --help             Show this help\n\nExamples:\n  baton whoami`,
    );
    return 0;
  }

  validateFlags(args, []);

  const actor = getCurrentActor();
  if (!actor) {
    renderError(isJson, 'No authenticated actor found. Please sign in with a registered agent.', 'UNAUTHORIZED');
    return 1;
  }

  const envelope = { status: 'success', actor: serializeActor(actor) };

  renderOutput(isJson, envelope, () => {
    console.log(`Active Agent: "${actor.name}" (ID: ${actor.id}, Type: ${actor.type})`);
  });

  return 0;
}
