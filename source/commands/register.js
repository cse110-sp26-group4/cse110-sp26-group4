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
import {
    getFlagValue,
    hasFlag,
    renderOutput,
    wantsHelp,
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

/**
 * Registers a new agent or human user
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error
 */
export async function run(args) {
    if (wantsHelp(args)) {
        console.log(HELP);
        return 0;
    }
    const isJson = hasFlag(args, '--json');
    const validFlags = ['--name', '--type', '--json'];
    
    // Check if user misspelled a flag
    for (const arg of args) {
        if (arg.startsWith('--')) {
            if (!validFlags.includes(arg)) {
                throw new Error(`Unknown flag provided: ${arg}. \nFlags: --name <n>, --type <t>, --json`);
            }
        }
    }

    try {
        const name = getFlagValue(args, '--name');
        const type = getFlagValue(args, '--type') || 'agent';

        if (!name) {
            throw new Error("Missing required flag: --name <name>");
        }

        if (type !== 'agent' && type !== 'human') {
            throw new Error(`Invalid type "${type}". Must be 'agent' or 'human'.`);
        }

        const agent = registerAgent(name, type);
        const envelope = { status: 'success', agent };

        renderOutput(isJson, envelope, (data) => {
            console.log(`\nSuccessfully registered ${data.agent.type}: "${data.agent.name}" (ID: ${data.agent.id})\n`);
        });

        return 0;
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            console.error(`Error: An agent or user with the name "${getFlagValue(args, '--name')}" is already registered.`);
        } else if (error.message.includes('Missing required') || error.message.includes('Invalid type')) {
            console.error(`Usage Error: ${error.message}`);
        } else {
            console.error("Error: Failed to register agent.");
            console.error(error.message);
        }
        return 1;
    }
}