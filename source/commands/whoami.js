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
import { COMMON_FLAGS, hasFlag, renderOutput, renderError, wantsHelp, parseAndValidateArgs } from '../util.js';


export const HELP = `Usage:
    baton whoami [--json]

Options:
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton whoami
`;

export const SPEC = { positionals: { min: 0, max: 0 }, flags: { ...COMMON_FLAGS } };
const VALID_FLAGS = ['--json', '-h', '--help'];


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
  const { flags } = parseAndValidateArgs(args, SPEC);
  if (flags['--help']) {
    console.log(HELP);
    return 0;
  }
  const isJson = flags['--json'] ?? false;

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
