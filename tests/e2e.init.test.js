import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useSandbox, createSandbox } from './sandbox.test.js';

describe('E2E: baton init', () => {
  const sb = useSandbox();

  // Default initialization tests

  it('exits 0 with valid specs', async () => {
    const result = await sb.runBaton(['init', '--specs', sb.specsPath]);
    assert.equal(result.exitCode, 0);
  });

  it('creates the database', async () => {
      const result = await sb.runBaton(['init', '--specs', sb.specsPath]);
      assert.ok(fs.existsSync(path.join(sb.dir, '.baton', 'baton.db')));
  });

  // TO DO: Edit this assertion once .md creation logic is implemented
  /*
  it('creates BATON_AGENT_RULES.md', async () => {
    await sb.runBaton(['init', '--specs', sb.specsPath]);
    assert.ok(fs.existsSync(path.join(sb.dir, 'BATON_AGENT_RULES.md')));
  });
  */

  it('creates the correct number of issues', async () => {
    const result = await sb.runBaton(['init', '--specs', sb.specsPath, '--json']);
    const data = sb.parseJSON(result);
    assert.equal(data.count, 2);
  });

  it('returns a valid JSON envelope with --json', async () => {
    const result = await sb.runBaton(['init', '--specs', sb.specsPath, '--json']);
    assert.equal(result.exitCode, 0);
    const data = sb.parseJSON(result);
    assert.equal(data.status, 'success');
    assert.ok(Array.isArray(data.issues));
    assert.equal(typeof data.count, 'number');
  });

  // --force tests

  it('will not reinit without --force', async () => {
    await sb.runBaton(['init', '--specs', sb.specsPath]);
    // TODO: remove register step once init auto-registers the user
    await sb.runBaton(['register', '--name', sb.humanName, '--type', 'human']);
    const result = await sb.runBaton(['init', '--specs', sb.specsPath]);
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /already initialized/i);
  });

  it('re-inits with --force', async () => {
    await sb.runBaton(['init', '--specs', sb.specsPath]);
    // TODO: remove register step once init auto-registers the user
    await sb.runBaton(['register', '--name', sb.humanName, '--type', 'human']);
    const result = await sb.runBaton(['init', '--specs', sb.specsPath, '--force']);
    assert.equal(result.exitCode, 0);
  });

  it('resets issues when run with --force', async () => {
    await sb.runBaton(['init', '--specs', sb.specsPath]);
    await sb.runBaton(['register', '--name', sb.humanName, '--type', 'human']);
    await sb.runBaton(['create', '--title', 'Extra issue']);
    const result = await sb.runBaton(['init', '--specs', sb.specsPath, '--force', '--json']);
    const data = sb.parseJSON(result);
    assert.equal(data.count, 2);
  });

  // --specs tests

  it('accepts a custom --specs path', async () => {
    const result = await sb.runBaton(['init', '--specs', sb.specsPath]);
    assert.equal(result.exitCode, 0);
  });

  it('exits non-zero when specs file does not exist', async () => {
    const result = await sb.runBaton(['init', '--specs', '/nonexistent/specs.md']);
    assert.notEqual(result.exitCode, 0);
    assert.match(result.stderr, /not found/i);
  });

  it('exits non-zero when both --specs and positional path are passed', async () => {
    const result = await sb.runBaton(['init', '--specs', sb.specsPath, sb.specsPath]);
    assert.notEqual(result.exitCode, 0);
  });

  // --- Edge cases ---

  it('creates 0 issues when specs has no issues with Must priority', async () => {
    const emptySpecsPath = path.join(sb.dir, 'empty-specs.md');
    fs.writeFileSync(emptySpecsPath, 
      `| TITLE | Priority | Requirement |
       |--------|----------|-------------|
       | FR-1.1 | Should | This should be ignored. |
    `);
    const result = await sb.runBaton(['init', '--specs', emptySpecsPath, '--json']);
    assert.equal(result.exitCode, 0);
    const data = sb.parseJSON(result);
    assert.equal(data.count, 0);
  });
});

describe('E2E: sandbox cleanup', () => {
  it('removes the temp directory after cleanup', () => {
    const sb = createSandbox();
    assert.ok(fs.existsSync(sb.dir));
    sb.cleanup();
    assert.ok(!fs.existsSync(sb.dir));
  });
});