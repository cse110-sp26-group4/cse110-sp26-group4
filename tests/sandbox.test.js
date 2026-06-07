// sandbox.js
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runBaton as _runBaton, parseJSON } from "./runBaton.test.js";
import { beforeEach, afterEach } from "node:test";

/**
 * @typedef {Object} Sandbox
 * @property {string} dir - Path to the temporary directory for this test.
 * @property {string} specsPath - Path to the minimal specs.md inside the sandbox.
 * @property {(args: string[]) => Promise<BatonResult>} runBaton - Runs the CLI inside the sandbox.
 * @property {(result: BatonResult) => unknown} parseJSON - Parses stdout as JSON.
 * @property {() => void} cleanup - Removes the temp directory.
 */

/**
 * Creates an isolated sandbox for e2e tests.
 * @returns {Sandbox}
 */
export function createSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "baton-test-"));

  // Defining format for a fake spec file
  const specsPath = path.join(dir, "specs.md");

  fs.writeFileSync(
    specsPath,
    `| ID | Priority | Requirement |
    |--------|----------|-------------|
    | FR-1.1 | Must | Sandbox test issue one. |
    | FR-1.2 | Must | Sandbox test issue two. |
  `,
  );

  function runBaton(args = []) {
    return _runBaton(args, { cwd: dir });
  }

  function cleanup() {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  return { dir, specsPath, runBaton, parseJSON, cleanup };
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
