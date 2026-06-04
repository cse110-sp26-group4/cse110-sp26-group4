// runBaton.js
// Helper function for e2e tests that runs the CLI 
// test/helpers/runBaton.js
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Adjust if your bin entry differs — check "bin" in package.json
const BATON_BIN = path.resolve(__dirname, '../source/cli.js');

/**
 * Runs the Baton CLI with the given args in the given working directory.
 * Always resolves — never rejects — so tests can assert on failure cases.
 *
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string> }} options
 * @returns {Promise<{ stdout: string, stderr: string, exitCode: number }>}
 */
export function runBaton(args = [], options = {}) {
  return new Promise((resolve) => {
    const proc = spawn(
      process.execPath,        // the same `node` binary running the tests
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
 * Throws a descriptive error if parsing fails so you know it's a
 * format issue, not a logic issue.
 *
 * @param {{ stdout: string, stderr: string, exitCode: number }} result
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