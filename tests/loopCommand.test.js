import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import { Status, Priority } from '../source/models/issue.js';
import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js';
import {
  createIssue,
  getIssue,
} from '../source/services/issuesService.js';
import { setCurrentActor } from '../source/services/context.js';
import { registerAgent } from '../source/services/agentsService.js';
import { run as loopCommand } from '../source/commands/loop.js';

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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Loop Command', () => {
  let sqlite;
  let capture;
  /** @type {object} */
  let testActor;

  beforeEach(() => {
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    setCurrentActor(null);
    if (sqlite) {
      sqlite.close();
    }
  });

  it('should fail when the tracker is not initialized', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    const exitCode = await loopCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('No tracker found'));
  });

  it('should run one step by default', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActor = registerAgent('loop-agent', 'agent');
    setCurrentActor(testActor);

    createIssue({ title: 'Loop Once', priority: Priority.HIGH });

    const exitCode = await loopCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Running baton for 1 step(s)')));
    assert.ok(capture.logs.some((line) => line.includes('--- Step 1/1 ---')));
    assert.ok(capture.logs.some((line) => line.includes('Completed 1 autonomous step(s)')));
  });

  it('should run multiple steps with --steps', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActor = registerAgent('loop-agent', 'agent');
    setCurrentActor(testActor);

    createIssue({ title: 'First', priority: Priority.HIGH });
    createIssue({ title: 'Second', priority: Priority.MEDIUM });

    const exitCode = await loopCommand(['--steps', '2']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('--- Step 1/2 ---')));
    assert.ok(capture.logs.some((line) => line.includes('--- Step 2/2 ---')));
    assert.ok(capture.logs.some((line) => line.includes('Completed 2 autonomous step(s)')));
  });

  it('should accept the -n alias', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActor = registerAgent('loop-agent', 'agent');
    setCurrentActor(testActor);

    createIssue({ title: 'Alias Step' });

    const exitCode = await loopCommand(['-n', '1']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Running baton for 1 step(s)')));
  });

  it('should continue later steps even when no open issues remain', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActor = registerAgent('loop-agent', 'agent');
    setCurrentActor(testActor);

    const issue = createIssue({ title: 'Only One' });

    const exitCode = await loopCommand(['--steps', '2']);

    assert.equal(exitCode, 0);
    assert.equal(getIssue(issue.id).status, Status.IN_PROGRESS);
    assert.ok(capture.logs.some((line) => line.includes('No open issues available')));
    assert.ok(capture.logs.some((line) => line.includes('Completed 2 autonomous step(s)')));
  });

  it('should support --json output', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActor = registerAgent('loop-agent', 'agent');
    setCurrentActor(testActor);

    createIssue({ title: 'JSON Loop' });

    const exitCode = await loopCommand(['--steps', '1', '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[capture.logs.length - 1]);
    assert.equal(output.status, 'success');
    assert.equal(output.steps, 1);
    assert.equal(output.completed, 1);
  });

  it('should reject a non-positive --steps value', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    await assert.rejects(
      () => loopCommand(['--steps', '0']),
      (err) => err.message.includes('Invalid value for --steps'),
    );
  });

  it('should reject --steps without a value', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    await assert.rejects(
      () => loopCommand(['--steps']),
      (err) => err.message.includes('Missing value for --steps'),
    );
  });
});
