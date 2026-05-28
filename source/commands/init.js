// init.js
// AI was consulted for large portions of this file.
// init command for the issue tracker
// usage: baton init [options] [<specs-path>]
// options:
//   --force: force initialization even if the tracker is already initialized
//   --specs <path>: path to the specs file (default: docs/specs/project-requirements.md)
//   <specs-path>: optional positional path to specs (same as --specs)
//
// examples usage of specs flag:
//  baton init --specs ./path/to/my-specs.md
//  baton init --specs C:\full\path\to\specs.md

/* global console, process */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { initDB } from '../db/index.js';
import { Priority } from '../models/issue.js';
import {
  createIssue,
  isTrackerReady,
  clearAllIssues,
} from '../services/issuesService.js';
import {
  getFlagValue,
  getFirstPositionalArg,
  hasFlag,
  resolvePath,
} from '../util.js';

/**
 * Default path to the specs file
 */
const DEFAULT_SPECS_PATH = join('docs', 'specs', 'project-requirements.md');

/**
 * Represents the parsed command-line flags for initialization.
 * @typedef {Object} InitFlags
 * @property {boolean} force - Whether to force initialization even if already initialized.
 * @property {string | null} specs - The resolved path to the specifications file.
 */

/**
 * Parses the initialization flags.
 * @param {string[]} args
 * @returns {InitFlags}
 */
function parseInitFlags(args) {
  const specsFromFlag = getFlagValue(args, '--specs');
  const positionalSpecs = getFirstPositionalArg(args, {
    valueFlags: ['--specs'],
    ignoreFlags: ['--force'],
  });

  if (specsFromFlag && positionalSpecs) {
    throw new Error('Pass specs path with either --specs <path> or a positional path, not both.');
  }

  return {
    force: hasFlag(args, '--force'),
    specs: specsFromFlag ?? positionalSpecs,
  };
}

/**
 * Represents a discrete requirement parsed from the markdown specs.
 * @typedef {Object} Requirement
 * @property {string} title - The title or ID of the requirement (e.g., FR-1).
 * @property {string} description - The detailed breakdown of the requirement.
 * @property {string} priority - The assigned urgency level.
 */

/**
 * Parses the must requirements from the markdown file.
 * Likely to be changed in future iterations when AI implementation is added.
 * @param {string} markdown
 * @returns {Requirement[]}
 */
function parseMustRequirements(markdown) {
  const issues = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    if (!line.includes('| Must |')) {
      continue;
    }
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3) {
      continue;
    }
    const id = cells[0];
    const requirement = cells[2];
    if (!/^FR-/.test(id) || !requirement) {
      continue;
    }
    issues.push({
      title: id,
      description: requirement,
      priority: Priority.MEDIUM,
    });
  }

  return issues;
}

/**
 * Generates issues from the specs file.
 * @param {string | null} specsPath
 * @returns {Issue[]}
 */
function generateIssuesFromSpecs(specsPath) {
  const resolvedPath = resolvePath(specsPath, DEFAULT_SPECS_PATH);

  if (!existsSync(resolvedPath)) {
    throw new Error(
      `Specs file not found at ${resolvedPath}. Pass --specs <path> or provide a positional path.`,
    );
  }

  const markdown = readFileSync(resolvedPath, 'utf8');
  const requirements = parseMustRequirements(markdown);

  if (requirements.length === 0) {
    return [];
  }

  return requirements.map((req) => createIssue(req));
}

/**
 * Runs the init command
 * @param {string[]} args - The command line arguments
 * @returns {Promise<number>} The exit code: 0 is success, 1 is error.
 */
export async function run(args = []) {
  let flags;
  try {
    flags = parseInitFlags(args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error('Usage: baton init [--force] [--specs <path>] [<specs-path>]');
    return 1;
  }

  if (isTrackerReady() && !flags.force) {
    console.error('Error: Tracker already initialized in this directory.');
    console.error('Run `baton init --force` to re-initialize.');
    return 1;
  }

  initDB();

  if (flags.force) {
    clearAllIssues();
  }

  const resolvedSpecsPath = resolvePath(flags.specs, DEFAULT_SPECS_PATH);
  const createdIssues = generateIssuesFromSpecs(flags.specs);

  console.log(`Tracker initialized at ${join(process.cwd(), 'data', 'issues.db')}`);
  console.log(`Specs: ${resolvedSpecsPath}`);
  console.log(`Created ${createdIssues.length} issue(s) from product specs.`);
  if (createdIssues.length > 0) {
    console.log('Issues:');
    for (const issue of createdIssues) {
      console.log(`  #${issue.id} [${issue.priority}] ${issue.title}`);
    }
  }
  console.log('Run `baton status` to review progress or `baton next` to start work.');

  return 0;
}
