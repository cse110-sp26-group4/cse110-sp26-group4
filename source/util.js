// util.js
// AI was consulted for small portions of this file.
// utility functions for the issue tracker transferred over from other files
// centralizing these functions here to avoid duplication and improve code organization.

import { isAbsolute, resolve } from 'node:path';

/**
 * Formats a timestamp as `HH:MM:SS YYYY-MM-DD`.
 * @param {Date | string | number | null | undefined} value
 * @returns {string}
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
  if (index === args.length - 1) {
    throw new Error(`Missing value for ${flag}.`);
  }
  return args[index + 1];
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
 * First positional argument, skipping flag tokens and values consumed by value flags.
 * @param {string[]} args
 * @param {{ valueFlags?: string[], ignoreFlags?: string[] }} [options]
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
