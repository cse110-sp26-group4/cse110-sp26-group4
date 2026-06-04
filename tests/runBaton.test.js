// runBaton.js
// Helper function for e2e tests that runs the CLI 

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BATON_BIN = path.resolve(__dirname, '../source/cli.js');

/**
 * @typedef {Object} BatonResult - Results of running CLI 
 * @property {string} stdout
 * @property {string} stderr
 * @property {number} exitCode
 */

/**
 * Runs the Baton CLI with the given args in the given working directory.
 *
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string> }} options
 * @returns {Promise<BatonResult>}
 */
export function runBaton(args = [], options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(
      process.execPath,        
      [BATON_BIN, ...args],
      {
        cwd: options.cwd ?? process.cwd(),
        env: { ...process.env, ...options.env },
      }
    );

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });

    proc.on('close', (exitCode) => {
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode });
    });
  });
}

/**
 * Parses the stdout of a runBaton result as JSON.
 * @param {BatonResult} 
 * @returns {unknown}
 */
export function parseJSON(result) {
  try {
    return JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Could not parse JSON output.\n` +
      `stdout: ${result.stdout || '(empty)'}\n` +
      `stderr: ${result.stderr || '(empty)'}\n` +
      `exitCode: ${result.exitCode}`
    );
  }
}