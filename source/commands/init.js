// init.js
// AI was consulted for large portions of this file.
// init command for the issue tracker
// usage: baton init [options] [<specs-path>]
// options:
//   --force: force initialization even if the tracker is already initialized
//   --specs <path>: path to the specs file (default: docs/specs/project-requirements.md)
//   <specs-path>: optional positional path to specs (same as --specs)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDB } from '../db/index.js';
import os from 'node:os';
import { registerAgent } from '../services/agentsService.js';
import { Priority } from '../models/issue.js';
import {
  createIssue,
  isTrackerReady,
  clearAllIssues,
} from '../services/issuesService.js';
import {
  renderOutput,
  renderError,
  resolvePath,
  serializeIssue,
  COMMON_FLAGS,
  parseAndValidateArgs,
} from '../util.js';

const DEFAULT_SPECS_PATH = join('docs', 'specs', 'project-requirements.md');
const DB_PATH = join(process.cwd(), '.baton', 'baton.db');

export const HELP = `Usage:
  baton init [--force] [--specs <path>] [<specs-path>]

Options:
  --force                Re-initialize an existing tracker database
  --specs <path>         Path to product specs file (overrides default)
  --json                 Output as JSON (for AI agents)
  -h, --help             Show this help

Examples:
  baton init
  baton init --specs ./my-specs.md
  baton init --force
`;

export const SPEC = {
  positionals: { min: 0, max: 1 },
  flags: { '--force': { type: 'boolean' }, '--specs': { type: 'string' }, ...COMMON_FLAGS }
};

/**
 * Extracts "Must" functional requirements from a markdown spec table.
 * @param {string} markdown - Raw markdown content of the specs file.
 * @returns {object[]} Array of objects with title, description, and priority fields.
 */
function parseMustRequirements(markdown) {
  const issues = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    if (!line.includes('| Must |')) continue;
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const id = cells[0];
    const requirement = cells[2];
    if (!/^FR-/.test(id) || !requirement) continue;
    issues.push({ title: id, description: requirement, priority: Priority.MEDIUM });
  }

  return issues;
}

/**
 * Reads the specs file and creates issues for every "Must" requirement found.
 * @param {string | null} specsPath - Resolved path to the specs file, or null to use the default.
 * @returns {Issue[]}
 */
function generateIssuesFromSpecs(specsPath) {
  const resolvedPath = resolvePath(specsPath, DEFAULT_SPECS_PATH);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Specs file not found at ${resolvedPath}. Pass --specs <path> or provide a positional path.`);
  }

  const markdown = readFileSync(resolvedPath, 'utf8');
  const requirements = parseMustRequirements(markdown);

  if (requirements.length === 0) return [];

  return requirements.map((req) => createIssue(req));
}

/**
 * Initializes the tracker database, auto-registers the current user, and seeds issues from specs.
 * @param {string[]} [args]
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  try {
    const { positionals, flags } = parseAndValidateArgs(args, SPEC);
    if (flags['--help']) {
      console.log(HELP);
      return 0;
    }
    const isJson = flags['--json'] ?? false;
    const force = flags['--force'] ?? false;
    const specsFlag = flags['--specs'];
    const specsPositional = positionals[0];

    if (specsFlag && specsPositional) {
      throw new Error('Pass specs path with either --specs <path> or a positional path, not both.');
    }

    const specsPath = specsFlag ?? specsPositional;

    if (isTrackerReady() && !force) {
      throw new Error('Tracker already initialized in this directory. Run `baton init --force` to re-initialize.');
    }

    initDB();

    if (force) clearAllIssues();

    // auto-register default deployment human user
    let autoRegisterMessage = '';
    try {
      const activeName = process.env.BATON_AGENT || os.userInfo().username;
      registerAgent(activeName, 'human');
      autoRegisterMessage = `Auto-registered default human user: "${activeName}"`;
    } catch (error) {
      if (!error.message?.includes('UNIQUE constraint failed')) {
        autoRegisterMessage = `Warning: Could not auto-register default user: ${error.message}`;
      }
    }

    if (autoRegisterMessage && !isJson) {
      console.log(autoRegisterMessage);
    }

    const templatePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'BATON_AGENT_RULES.md');

    let rulesContent = '';
    if (existsSync(templatePath)) {
      rulesContent = readFileSync(templatePath, 'utf8');
    }

    const outputPath = join(process.cwd(), 'BATON_AGENT_RULES.md');
    if (!existsSync(outputPath) || force) {
      writeFileSync(outputPath, rulesContent, 'utf8');
    }

    const resolvedSpecsPath = resolvePath(specsPath, DEFAULT_SPECS_PATH);
    const createdIssues = generateIssuesFromSpecs(specsPath);
    const envelope = {
      status: 'success',
      db_path: DB_PATH,
      specs_path: resolvedSpecsPath,
      count: createdIssues.length,
      issues: createdIssues.map(serializeIssue),
    };

    renderOutput(isJson, envelope, () => {
      console.log(`Tracker initialized at ${DB_PATH}`);
      console.log(`Specs: ${resolvedSpecsPath}`);
      console.log(`Created ${createdIssues.length} issue(s) from product specs.`);
      if (createdIssues.length > 0) {
        console.log('Issues:');
        for (const issue of createdIssues) {
          console.log(`  #${issue.id} [${issue.priority}] ${issue.title}`);
        }
      }
      console.log('Run `baton status` to review progress.');
    });

    return 0;
  } catch (error) {
    const isJson = args.includes('--json');
    let code = 'ERROR';
    if (error.message.includes('already initialized')) {
      code = 'ALREADY_INITIALIZED';
    }
    renderError(isJson, error.message, code);
    return 1;
  }
}
