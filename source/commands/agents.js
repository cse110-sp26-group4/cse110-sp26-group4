// agents.js
// Lists all registered agents and humans in the tracker.
// Usage: baton agents [--json]
//
// Options:
//   --json                 Output as JSON (for AI agents)
//   -h, --help             Show this help
//
// Examples:
//   baton agents

import { listAgents } from '../services/agentsService.js';
import { hasFlag, renderOutput, wantsHelp } from '../util.js';

export const HELP = `Usage:
  baton agents [--json]

Options:
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton agents
`;

const VALID_FLAGS = ['--json'];

const COL = { id: 4, name: 14, type: 5 };

/**
 * @param {Agent} agent
 * @returns {{ id: number, name: string, type: string }}
 */
function serializeAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type,
  };
}

/**
 * @param {Agent[]} agents
 */
function printAgentsTable(agents) {
  console.log(
    `${'ID'.padEnd(COL.id)} | ${'Name'.padEnd(COL.name)} | Type`,
  );
  for (const agent of agents) {
    console.log(
      `${String(agent.id).padEnd(COL.id)} | ${agent.name.padEnd(COL.name)} | ${agent.type}`,
    );
  }
}

/**
 * Lists all registered agents and humans.
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args = []) {
  if (wantsHelp(args)) {
    console.log(HELP);
    return 0;
  }
  const isJson = hasFlag(args, '--json');

  for (const arg of args) {
    if (arg.startsWith('--') && !VALID_FLAGS.includes(arg)) {
      throw new Error(`Unknown flag provided: ${arg}.\nFlags: --json`);
    }
  }

  try {
    const agents = listAgents();
    const records = agents.map(serializeAgent);
    const envelope = { status: 'success', count: records.length, agents: records };

    renderOutput(isJson, envelope, (data) => {
      if (data.count === 0) {
        console.log('No registered agents or humans found.');
        return;
      }
      printAgentsTable(agents);
    });

    return 0;
  } catch (error) {
    console.error('Error: Failed to list agents.');
    console.error(error.message);
    return 1;
  }
}
