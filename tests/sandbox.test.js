// sandbox.js 
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runBaton as _runBaton, parseJSON } from './runBaton.test.js';
import { beforeEach, afterEach } from 'node:test';

/**
 * @typedef {Object} sandbox
 * @property {string} dir - Path to the temporary directory for this test.
 * @property {string} specsPath - Path to the minimal specs.md inside the sandbox.
 * @property {string} humanName - The name of the human actor.
 * @property {string} agentName - The name of the AI agent actor.
 * @property {(args: string[]) => Promise<BatonResult>} runBaton - Runs the CLI inside the sandbox.
 * @property {(args: string[]) => Promise<BatonResult>} runAsHuman - Runs the CLI as the human actor.
 * @property {(args: string[]) => Promise<BatonResult>} runAsAgent - Runs the CLI as the AI agent.
 * @property {(result: BatonResult) => unknown} parseJSON - Parses stdout as JSON.
 * @property {() => void} cleanup - Removes the temp directory.
 */

/**
 * Creates an isolated sandbox for e2e tests.
 * @returns {sandbox}
 */
export function createSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'baton-test-'));

  // Defining format for a fake spec file
  const specsPath = path.join(dir, 'specs.md');

  fs.writeFileSync(specsPath, 
   `| Title | Priority | Requirement |
    |--------|----------|-------------|
    | FR-1.1 | Must | Sandbox test issue one. |
    | FR-1.2 | Must | Sandbox test issue two. |
  `);

  function execute(args, identity) {
    return _runBaton(args, { 
      cwd: dir, 
      env: { BATON_AGENT: identity } 
    });
  }

  function cleanup() {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const humanName = 'E2E-Sandbox-Human';
  const agentName = 'E2E-Sandbox-Agent';

  const sandbox = {
    dir,
    specsPath,
    humanName,
    agentName,
    // config for different agent types:
    runBaton: (args) => execute(args, humanName), 
    runAsHuman: (args) => execute(args, humanName),
    runAsAgent: (args) => execute(args, agentName),
    parseJSON,
    cleanup,
  };

  return sandbox;
}

/**
 * Setup / teardown hook for test suites
 * @returns {Sandbox} 
 */
export function useSandbox() {
  const ref = /** @type {ReturnType<typeof createSandbox>} */ ({});

  beforeEach(() => {
    const sandbox = createSandbox();
    Object.assign(ref, sandbox);
  });

  afterEach(() => {
    ref.cleanup();
  });

  return ref;
}