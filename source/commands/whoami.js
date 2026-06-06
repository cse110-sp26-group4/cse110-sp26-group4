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
import { hasFlag, renderOutput, renderError, wantsHelp } from '../util.js';

const VALID_FLAGS = ['--json', '-h', '--help'];

function serializeActor(actor) {
  return {
    id: actor.id,
    name: actor.name,
    type: actor.type,
  };
}

export async function run(args = []) {
  const isJson = hasFlag(args, '--json');

  if (wantsHelp(args)) {
    console.log(
      `Usage: baton whoami [--json]\n\nOptions:\n  --json                 Output as JSON (for AI agents)\n  -h, --help             Show this help\n\nExamples:\n  baton whoami`,
    );
    return 0;
  }

  for (const arg of args) {
    if (arg.startsWith('-') && !VALID_FLAGS.includes(arg)) {
      throw new Error(`Unknown flag provided: ${arg}.\nFlags: --json, -h, --help`);
    }
  }

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
