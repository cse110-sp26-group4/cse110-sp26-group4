// register.js
// AI was consulted for some portions of this file.
// register command which allows the user to register a new AI agent or human
// Usage: baton register --name <name> [--type <type>] [--json]
//
// Options:
//  --name <n>        Name of the agent or human (required)
//  --type <t>        Type: agent | human (default: agent)
//  --json            Output as JSON (for AI agents)
//  -h, --help        Show this help

import { registerAgent } from '../services/agentsService.js';
import { AgentType } from '../models/agents.js';
import {
    getFlagValue,
    hasFlag,
    renderOutput,
    wantsHelp,
    COMMON_FLAGS,
} from '../util.js';

export const HELP = `Usage:
    baton register --name <name> [--type <type>]

Options:
    --name <n>             Name of the agent or human (required)
    --type <t>             agent | human (default: agent)
    --json                 Output as JSON (for AI agents)
    -h, --help             Show this help

Examples:
    baton register --name claude-dev --type agent
`;

export const SPEC = {
  positionals: { min: 0, max: 0 },
  flags: { '--name': { type: 'string' }, '--type': { type: 'enum', values: Object.values(AgentType) }, ...COMMON_FLAGS }
};

/**
 * Registers a new agent or human user
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
    const { flags } = parseAndValidateArgs(args, SPEC);
    if (flags['--help']) {
        console.log(HELP);
        return 0;
    }
    const isJson = flags['--json'] ?? false;

    try {
        const name = flags['--name'];
        const type = flags['--type'] || 'agent';

        if (!name) {
            throw new Error("Missing required flag: --name <name>");
        }

        const agent = registerAgent(name, type);
        const envelope = { status: 'success', agent };

        renderOutput(isJson, envelope, (data) => {
            console.log(`\nSuccessfully registered ${data.agent.type}: "${data.agent.name}" (ID: ${data.agent.id})\n`);
        });

        return 0;
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.error(`Error: An agent or user with the name "${flags['--name']}" is already registered.`);
        } else if (error.message.includes('Missing required') || error.message.includes('Invalid type')) {
            console.error(`Usage Error: ${error.message}`);
        } else {
            console.error("Error: Failed to register agent.");
            console.error(error.message);
        }
        return 1;
    }
}