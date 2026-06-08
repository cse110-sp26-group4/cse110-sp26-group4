// util.js
// AI was consulted for small portions of this file.
// utility functions for the issue tracker transferred over from other files
// centralizing these functions here to avoid duplication and improve code organization.

import { isAbsolute, resolve } from 'node:path';
import { issueSchema } from '../source/models/schema.js';
import { getAgentById } from '../source/services/agentsService.js';

/**
 * Formats a timestamp as `HH:MM:SS YYYY-MM-DD`.
 * @param {Date | string | number | null | undefined} value
 * @returns {string}
 */
export function formatTimestamp(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Checks if the user wants help by checking if the --help or -h flag is present in the command line arguments.
 * @param {string[]} args
 * @returns {boolean}
 */
export function wantsHelp(args) {
  return args.includes('--help') || args.includes('-h');
}

/**
 * Checks if the user has a specific flag in the command line arguments.
 * @param {string[]} args
 * @param {string} flag
 * @returns {boolean}
 */
export function hasFlag(args, flag) {
  return args.includes(flag);
}

/**
 * Validates that all flags in args are in the valid flags list
 * @param {string[]} args
 * @param {string[]} validFields Valid keys from issueSchema 
 * @param {string} [hint] Optional hint to append to the error message
 * @param {Boolean} allowPositional True if command allows positional arguments, false otherwise
 * @throws {Error} If an unknown flag is found
 */
export function validateFlags(args, validFields, hint = '', { allowPositional = false } = {}) {
  const validFlags = new Set([
    ...validFields.map(key => issueSchema[key].flag),
    '--json',
  ]);

 for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--')) {
      if (!validFlags.has(arg)) throw new Error(`Unknown flag: ${arg}\nValid flags: ${[...validFlags].join(', ')}${hint ? `\n${hint}` : ''}`);
      
      // If this flag requires a value, skip the next index
      const config = Object.values(issueSchema).find(c => c.flag === arg);
      if (config && config.type !== 'boolean') {
        i++; // "Consume" the value so it doesn't trigger the positional error
      }
      continue;
    }

    // Identify Negative Numbers
    if (/^-\d+/.test(arg)) continue;

    if (!allowPositional) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
}

/**
 * Gets the value of a specific flag in the command line arguments.
 * @param {string[]} args
 * @param {string} flag
 * @returns {string | null}
 * @throws {Error} If the flag is present without a following value
 */
export function getFlagValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }

  let endIdx = args.length;
  // Finds beginning of next flag 
  for (let i = index + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      endIdx = i;
      break;
    }
  }

  if (index === args.length - 1) {
    throw new Error(`Missing value for ${flag}.`);
  }

  // join the elements into one sentence
  return args.slice(index + 1, endIdx).join(' ');
}

/**
 * Gets a positive integer flag value from the command line arguments.
 * @param {string[]} args
 * @param {string} flag
 * @returns {number | null} The parsed value, or null if the flag is not present
 * @throws {Error} If the flag is present without a following value or the value is invalid
 */
export function getNumericFlag(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  if (index === args.length - 1) {
    throw new Error(`Missing value for ${flag}.`);
  }

  const raw = args[index + 1];
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Invalid value for ${flag}: expected a positive integer, got "${raw}".`,
    );
  }

  return value;
}

/**
 * Normalizes a field value based on the provided schema/constants.
 * @param {Object} schema The constant object (Status or Priority).
 * @param {string} value The input value to normalize.
 * @returns {string} The normalized value / original if no match found.
 */
export function normalizeValue(schema, value) {
  if (!value) return value;
  
  const match = Object.values(schema).find(
    (v) => v.toLowerCase() === value.toLowerCase()
  );
  
  return match ?? value;
}

/**
 * Parses command line arguments and extracts values for any flags / data fields
 * @param {string[]} args The command line arguemnts
 * @returns {Object} Object with relevant keys from issueSchema
*/
export function parseArgs(args) {
  const options = {};
  for (const [key, config] of Object.entries(issueSchema)) {
        if (!hasFlag(args, config.flag)) continue;

      // Use numericFlag helper if the argument type is a number
        let value = config.type === 'number' 
            ? getNumericFlag(args, config.flag) 
            : getFlagValue(args, config.flag);
      
        // skip field if no argument was entered
        if (value === null) continue;

        // normalize enum fields by case-insensitive match
        if (config.type === 'enum' && config.values) {
          value = normalizeValue(config.values, value);
        }
        options[key] = value;
  }
  return options;
}
/**
 * Represents the options for parsing the first positional argument.
 * @typedef {Object} FirstPositionalArgOptions
 * @property {string[]} [valueFlags]
 * @property {string[]} [ignoreFlags]
 */

/**
 * First positional argument, skipping flag tokens and values consumed by value flags.
 * @param {string[]} args
 * @param {FirstPositionalArgOptions} [options]
 * @returns {string | null}
 */
export function getFirstPositionalArg(
  args,
  { valueFlags = [], ignoreFlags = [] } = {},
) {
  const skipIndices = new Set();

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (ignoreFlags.includes(arg)) {
      continue;
    }
    if (valueFlags.includes(arg)) {
      skipIndices.add(i);
      skipIndices.add(i + 1);
    }
  }

  for (let i = 0; i < args.length; i += 1) {
    if (skipIndices.has(i) || args[i].startsWith('-')) {
      continue;
    }
    return args[i];
  }

  return null;
}

/**
 * Resolves a user path or falls back to a default (relative to cwd when needed).
 * @param {string | null | undefined} userPath
 * @param {string} defaultPath
 * @returns {string}
 */
export function resolvePath(userPath, defaultPath) {
  const target = userPath ?? defaultPath;
  return isAbsolute(target) ? target : resolve(process.cwd(), target);
}

/**
 * Prints the standard error when the tracker is not initialized.
 */
export function reportTrackerNotReady() {
  console.error('Error: No tracker found in this directory.');
  console.error('Run `baton init` first.');
}

/**
 * Converts DB-style enum values to lowercase snake_case for JSON output.
 * e.g. "In-Progress" → "in_progress"
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function toJsonEnum(value) {
  return value?.toLowerCase().replace(/-/g, '_') ?? null;
}

/**
 * Converts a camelCase string to snake_case.
 * @param {string} str
 * @returns {string}
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Normalizes a DB row or Issue instance into a stable JSON-friendly shape.
 * Dynamically built from issueSchema so the output always matches the schema.
 * @param {object} issue
 * @returns {object}
 */
export function serializeIssue(issue) {
  const skip = new Set(['limit', 'offset']);
  const result = {};

  for (const [key, config] of Object.entries(issueSchema)) {
    if (skip.has(key)) continue;
    const snakeKey = camelToSnake(key);
    const value = issue[key] ?? issue[snakeKey] ?? null;
    result[snakeKey] = config.type === 'enum' ? toJsonEnum(value) : value;
  }

  result.created_at = issue.createdAt ?? issue.created_at ?? null;
  result.last_updated = issue.lastUpdated ?? issue.last_updated ?? null;

  return result;
}

/**
 * Centralized output renderer.
 * If isJson is true, outputs the envelope as JSON.
 * Otherwise, runs the human-readable callback.
 * @param {boolean} isJson - Whether the user passed the --json flag
 * @param {object} envelope - Structured response payload (e.g. { status, issues })
 * @param {Function} humanOutput - Callback for human terminal styling
 */
export function renderOutput(isJson, envelope, humanOutput) {
  if (isJson) {
    console.log(JSON.stringify(envelope, null, 2));
    return;
  }
  humanOutput(envelope);
}

/**
 * Prints an error in JSON or plain text depending on output mode.
 * @param {boolean} isJson
 * @param {string} message
 * @param {string} [code='ERROR']
 */
export function renderError(isJson, message, code = 'ERROR') {
  if (isJson) {
    console.error(JSON.stringify({ status: 'error', code, message }));
    return;
  }
  console.error(`Error: ${message}`);
}

/**
 * Configuration for table column widths.
 */
export const WIDTHS = {
  id: 5,
  title: 20,
  status: 15,
  priority: 10,
  assignee: 10, 
  description: 50
};

/**
 * Prints the table header row and separator line.
 * @returns {void}
 */
export function printTableHeader() {
  console.log(
    "ID".padEnd(WIDTHS.id) + " │ " +
    "TITLE".padEnd(WIDTHS.title) + " │ " +
    "STATUS".padEnd(WIDTHS.status) + " │ " +
    "PRIORITY".padEnd(WIDTHS.priority) + " │ " +
    "ASSIGNEE".padEnd(WIDTHS.assignee) + " │ " +
    "DESCRIPTION".padEnd(WIDTHS.description)
  );
  console.log(
    "─".repeat(WIDTHS.id) + "─┼─" +
    "─".repeat(WIDTHS.title) + "─┼─" +
    "─".repeat(WIDTHS.status) + "─┼─" +
    "─".repeat(WIDTHS.priority) + "─┼─" +
    "─".repeat(WIDTHS.assignee) + "─┼─" +
    "─".repeat(WIDTHS.description)
  );
}

// Helper for printIssueTable 
/**
 * Truncates a string to a specific length and adds ellipsis if it exceeds the specified length
 * @param {string} str The string to be truncated
 * @param {number} length The maximum length of the string 
 * @returns {string} The truncated string 
 */
export function truncate(str, length) {
    if (str === null || str === undefined || str === '') return "N/A";
    const s = String(str);
    if (s.length > length) {
        return s.substring(0, length - 3) + "...";
    }
    return s;
}

/**
 * Helper function used to format and print Issues in a table
 * @param {Object} issue 
 * @returns {void}
 */
export function printIssueTable(issue) {
  const idVal = String(issue.id).padEnd(WIDTHS.id);
  const titleVal = truncate(issue.title || `Issue #${issue.id}`, WIDTHS.title).padEnd(WIDTHS.title);
  const statusVal = truncate(issue.status, WIDTHS.status).padEnd(WIDTHS.status);
  const priorityVal = truncate(issue.priority, WIDTHS.priority).padEnd(WIDTHS.priority);
  const descVal = truncate(issue.description, WIDTHS.description).padEnd(WIDTHS.description);

  // Getting Agent name from id
  const assigneeId = issue.assigneeId ?? issue.assignee_id ?? null;
  const assignee = assigneeId ? getAgentById(assigneeId) : null;
  const assigneeVal = truncate(assignee?.name ?? null, WIDTHS.assignee).padEnd(WIDTHS.assignee);

  console.log(`${idVal} │ ${titleVal} │ ${statusVal} │ ${priorityVal} │ ${assigneeVal} │ ${descVal}`);
}