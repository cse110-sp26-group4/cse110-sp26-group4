import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js';
import { getAllIssues, isTrackerReady } from '../source/services/issuesService.js';
import { run as initCommand } from '../source/commands/init.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
  } else {
    throw new Error('Migrations folder not found!');
  }

  return { sqlite, db };
}

function makeEmptyDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}

function captureConsole() {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => errors.push(args.join(' '));

  return {
    logs,
    errors,
    restore() {
      console.log = originalLog;
      console.error = originalError;
    },
  };
}

const SAMPLE_SPECS = `# Specs
| ID | Priority | Requirement |
|----|----------|-------------|
| FR-1 | Must | First must requirement |
| FR-2 | Must | Second must requirement |
| FR-3 | Should | Should not be seeded |
| BAD | Must | Missing FR prefix |
`;

function writeTempSpecs(content = SAMPLE_SPECS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'baton-init-specs-'));
  const filePath = path.join(dir, 'specs.md');
  fs.writeFileSync(filePath, content, 'utf8');
  return { dir, filePath };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Init Command', () => {
  let sqlite;
  let capture;
  /** @type {string[]} */
  let tempDirs;

  beforeEach(() => {
    capture = captureConsole();
    tempDirs = [];
  });

  afterEach(() => {
    capture.restore();
    if (sqlite) {
      sqlite.close();
      sqlite = undefined;
    }
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('should initialize a fresh tracker from a specs file', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);
    assert.equal(isTrackerReady(), false);

    const { dir, filePath } = writeTempSpecs();
    tempDirs.push(dir);

    const exitCode = await initCommand(['--specs', filePath]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Tracker initialized')));
    assert.ok(capture.logs.some((line) => line.includes('Created 2 issue(s)')));

    const issues = getAllIssues();
    assert.equal(issues.length, 2);
    assert.equal(issues[0].title, 'FR-1');
    assert.equal(issues[1].title, 'FR-2');
  });

  it('should accept a positional specs path', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    const { dir, filePath } = writeTempSpecs();
    tempDirs.push(dir);

    const exitCode = await initCommand([filePath]);

    assert.equal(exitCode, 0);
    assert.equal(getAllIssues().length, 2);
  });

  it('should support --json output', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    const { dir, filePath } = writeTempSpecs();
    tempDirs.push(dir);

    const exitCode = await initCommand(['--specs', filePath, '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.count, 2);
    assert.equal(output.issues.length, 2);
    assert.ok(output.specs_path.includes('specs.md'));
  });

  it('should fail when the tracker is already initialized without --force', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    assert.equal(isTrackerReady(), true);

    const exitCode = await initCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Tracker already initialized'));
  });

  it('should re-initialize with --force and replace seeded issues', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    const { dir, filePath } = writeTempSpecs('| FR-9 | Must | Forced seed issue |');
    tempDirs.push(dir);

    const exitCode = await initCommand(['--force', '--specs', filePath]);

    assert.equal(exitCode, 0);
    const issues = getAllIssues();
    assert.equal(issues.length, 1);
    assert.equal(issues[0].title, 'FR-9');
  });

  it('should fail when both --specs and a positional path are provided', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    const { dir, filePath } = writeTempSpecs();
    tempDirs.push(dir);

    const exitCode = await initCommand(['--specs', filePath, filePath]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('not both'));
  });

  it('should fail when the specs file does not exist', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    await assert.rejects(
      () => initCommand(['--specs', path.join(os.tmpdir(), 'missing-specs.md')]),
      (err) => err.message.includes('Specs file not found'),
    );
  });

  it('should succeed with zero issues when specs contain no Must requirements', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    const { dir, filePath } = writeTempSpecs(`# Empty
| FR-1 | Should | Not a must row |
| NFR-1 | Must | Missing FR prefix |
`);
    tempDirs.push(dir);

    const exitCode = await initCommand(['--specs', filePath]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Created 0 issue(s)')));
    assert.equal(getAllIssues().length, 0);
  });
});
