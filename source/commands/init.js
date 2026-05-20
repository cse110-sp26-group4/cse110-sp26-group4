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

import { readFileSync, existsSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { initDB, getDB } from '../db.js';

/**
 * Default path to the specs file
 */
const DEFAULT_SPECS_PATH = join('docs', 'specs', 'project-requirements.md');

/**
 * Priority order for the issues so that the AI agent can prioritize issues with higher priority 
 */
const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

/**
 * Checks if the tracker is ready by checking if the issues table exists
 * @returns {boolean} true if the tracker is ready, false otherwise
 */
export function isTrackerReady() {
  const row = getDB().prepare(
    "SELECT 1 AS ready FROM sqlite_master WHERE type = 'table' AND name = 'issues'"
  ).get();
  return Boolean(row);
}

/**
 * Logs activity in the issue tracker to the activity table
 * @param {number} issueId - The unique issue id that is used to identify the issue
 * @param {string} action - The action that was performed on the issue. Options: 'state_change', 'priority_change', 'edit', 'read', 'creation', 'deletion'.
 * @param {string} details - A text description of the activity
 */
export function logActivity(issueId, action, details = '') {
  getDB().prepare(
    'INSERT INTO activity (issue_id, action, details) VALUES (?, ?, ?)'
  ).run(issueId, action, details);
}

/**
 * The placeholder for the auto title of the issue
 */
export const AUTO_TITLE_PLACEHOLDER = 'PENDING';

/**
 * Creates a new issue in the issues table
 * @param {string} title - The title of the issue
 * @param {string} description - The text description of the issue
 * @param {string} priority - The priority of the issue from 'Low', 'Medium', 'High'. Default is 'Low'.
 * @param {string} status - The status of the issue from 'Open', 'In-Progress', 'Closed'. Default is 'Open'.
 * @param {number} tokenLimit - The token limit of the issue. Default is null.
 * @returns The issue object
 */
export function createIssue({
  title,
  description = null,
  priority = 'Low',
  status = 'Open',
  tokenLimit = null,
} = {}) {
  const db = getDB();
  const useAutoTitle =
    title === undefined || title === null || title === AUTO_TITLE_PLACEHOLDER;

  const result = useAutoTitle
    ? db.prepare(
        `INSERT INTO issues (description, priority, status, token_limit)
         VALUES (?, ?, ?, ?)`
      ).run(description, priority, status, tokenLimit)
    : db.prepare(
        `INSERT INTO issues (title, description, priority, status, token_limit)
         VALUES (?, ?, ?, ?, ?)`
      ).run(title, description, priority, status, tokenLimit);

  const issueId = result.lastInsertRowid;
  const row = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
  logActivity(issueId, 'creation', `Issue created: ${row.title}`);
  return row;
}

/**
 * Formats a timestamp to the format of 'HH:MM:SS YYYY-MM-DD'
 * @param {Date | string | number | null | undefined} value - The timestamp to format. Input can be a Date object, a string, or a number.
 * @returns {string} The formatted timestamp
 */
export function formatTimestamp(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Gets the statistics of the issues in the issues table: total, open, in-progress, and closed issues.
 * @returns The statistics of the issues in the issues table
 */
export function getIssueStats() {
  const db = getDB();
  const total = db.prepare('SELECT COUNT(*) AS count FROM issues').get().count;
  const open = db.prepare("SELECT COUNT(*) AS count FROM issues WHERE status = 'Open'").get().count;
  const inProgress = db.prepare("SELECT COUNT(*) AS count FROM issues WHERE status = 'In-Progress'").get().count;
  const closed = db.prepare("SELECT COUNT(*) AS count FROM issues WHERE status = 'Closed'").get().count;
  return { total, open, inProgress, closed };
}

/**
 * Gets all the issues in the issues table
 * @returns All the issues in the issues table sorted by id in ascending order
 */
export function getAllIssues() {
  return getDB().prepare('SELECT * FROM issues ORDER BY id ASC').all();
}

/**
 * Selects the next issue to work on from the issues table
 * The issue is selected based on the following criteria:
 * 1. The issue selected must have status: 'Open'
 * 2. The issue selected must have the highest priority exisitng open issue (not necessarily 'high' if there are no 'high' issues)
 * 3. The issue selected must have the lowest id so that we can addresss oldest issues first
 * @returns The next issue to work on from the issues table
 */
export function selectNextIssue() {
  const issues = getDB()
    .prepare("SELECT * FROM issues WHERE status = 'Open' ORDER BY id ASC")
    .all();

  if (issues.length === 0) {
    return null;
  }

  issues.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    return a.id - b.id;
  });

  return issues[0];
}

/**
 * Updates the status of the issue to 'In-Progress' and increments the attempt number
 * @param {number} issueId - The id of the issue to work on
 * @returns The issue object
 */
export function workOnIssue(issueId) {
  const db = getDB();
  const issue = db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
  if (!issue) {
    throw new Error(`Issue #${issueId} not found.`);
  }
  if (issue.status === 'Closed') {
    throw new Error(`Issue #${issueId} is closed and cannot be worked on.`);
  }

  logActivity(issueId, 'read', `Agent accessed issue #${issueId}`);

  db.prepare(
    `UPDATE issues
     SET status = 'In-Progress', attempt_num = attempt_num + 1
     WHERE id = ?`
  ).run(issueId);

  logActivity(
    issueId,
    'state_change',
    `Status changed from ${issue.status} to In-Progress`,
  );
  logActivity(
    issueId,
    'edit',
    `Agent attempt #${issue.attempt_num + 1} on issue #${issueId}`,
  );

  return db.prepare('SELECT * FROM issues WHERE id = ?').get(issueId);
}

/**
 * Parses the flags from the command line arguments
 * Has checks that you are passing the flags correctly
 * @param {string[]} args - The command line arguments
 * @returns The flags object
 */
function parseFlags(args) {
  const specsFromFlag = getFlagValue(args, '--specs');
  const positionalSpecs = getPositionalSpecsPath(args);

  if (specsFromFlag && positionalSpecs) {
    throw new Error('Pass specs path with either --specs <path> or a positional path, not both.');
  }

  return {
    force: args.includes('--force'),
    specs: specsFromFlag ?? positionalSpecs,
  };
}

/**
 * Gets the value of a flag from the command line arguments
 * @param {string[]} args - The command line arguments
 * @param {string} flag - The flag to get the value of
 * @returns {string | null} The value of the flag
 */
function getFlagValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  if (index === args.length - 1) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return args[index + 1];
}

/**
 * Gets the positional specs path from the command line arguments
 * @param {string[]} args - The command line arguments
 * @returns {string | null} The positional specs path
 */
function getPositionalSpecsPath(args) {
  const skipIndices = new Set();
  for (let i = 0; i < args.length; i += 1) {
    if (!args[i].startsWith('--')) {
      continue;
    }
    if (args[i] === '--force') {
      continue;
    }
    if (args[i] === '--specs') {
      skipIndices.add(i);
      skipIndices.add(i + 1);
    }
  }

  for (let i = 0; i < args.length; i += 1) {
    if (skipIndices.has(i) || args[i].startsWith('--')) {
      continue;
    }
    return args[i];
  }

  return null;
}

/**
 * Resolves the specs path from the command line arguments
 * Need this to ensure that the user can specify the specs path in a relative path from the current working directory
 * @param {string | null} userPath - The path to the specs file
 * @returns {string} The resolved specs path
 */
function resolveSpecsPath(userPath) {
  const specsPath = userPath ?? DEFAULT_SPECS_PATH;
  return isAbsolute(specsPath) ? specsPath : resolve(process.cwd(), specsPath);
}

/**
 * Parses the must requirements from the specs file
 * Assumes that the user formatted their specs files correctly.
 * See docs/specs/specs-format.md for the correct format and docs/specs/specs-example.md for an example.
 * This function will likely be changed in the future when AI agent is implemented as the AI will select how to parse and create issues as well as how it will assign priorities to issues.
 * @param {string} markdown - The markdown content of the specs file
 * @returns The issues object
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
      priority: 'Medium',   // currently all issues are set to medium priority, this will be changed in future iterations when AI agent is implemented.
    });
  }

  return issues;
}

/**
 * Generates the issues from the specs file
 * This function will likely be changed in the future as the AI agent will decide what issues to create and the priority of the issues.
 * @param {string | null} specsPath - The path to the specs file
 * @returns The issues object
 */
function generateIssuesFromSpecs(specsPath) {
  const resolvedPath = resolveSpecsPath(specsPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(
      `Specs file not found at ${resolvedPath}. Pass --specs <path> or provide a positional path.`
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
 * @returns {number} The exit code: 0 is success, 1 is error, 2 is invalid input.
 */
export async function run(args = []) {
  let flags;
  try {
    flags = parseFlags(args);
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
    getDB().exec('DELETE FROM issues');
  }

  const resolvedSpecsPath = resolveSpecsPath(flags.specs);
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
