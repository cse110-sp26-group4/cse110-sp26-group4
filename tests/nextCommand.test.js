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
  approveIssue,
  getIssue,
  setActiveActor,
} from '../source/services/issuesService.js';
import { registerAgent } from '../source/services/agentsService.js';
import { run as nextCommand } from '../source/commands/next.js';

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

describe('Next Command', () => {
  let sqlite;
  let capture;
  /** @type {number} */
  let testActorId;

  beforeEach(() => {
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    setActiveActor(null);
    if (sqlite) {
      sqlite.close();
    }
  });

  it('should fail when the tracker is not initialized', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db);

    const exitCode = await nextCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('No tracker found'));
  });

  it('should report success when no open issues remain', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActorId = registerAgent('next-agent', 'agent').id;
    setActiveActor(testActorId);

    const closed = createIssue({ title: 'Already Done' });
    approveIssue(closed.id);

    const exitCode = await nextCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('No open issues available')));
  });

  it('should claim the highest-priority open issue', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActorId = registerAgent('next-agent', 'agent').id;
    setActiveActor(testActorId);

    const low = createIssue({ title: 'Low Priority', priority: Priority.LOW });
    const high = createIssue({ title: 'High Priority', priority: Priority.HIGH });

    const exitCode = await nextCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes(`ID:          #${high.id}`)));
    assert.ok(capture.logs.some((line) => line.includes('High Priority')));

    const updatedHigh = getIssue(high.id);
    const unchangedLow = getIssue(low.id);
    assert.equal(updatedHigh.status, Status.IN_PROGRESS);
    assert.equal(updatedHigh.attemptNum, 1);
    assert.equal(unchangedLow.status, Status.OPEN);
  });

  it('should include the description when present', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActorId = registerAgent('next-agent', 'agent').id;
    setActiveActor(testActorId);

    createIssue({
      title: 'Detailed Issue',
      description: 'Fix the auth flow',
      priority: Priority.MEDIUM,
    });

    const exitCode = await nextCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Description: Fix the auth flow')));
  });

  it('should support --json output on success', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActorId = registerAgent('next-agent', 'agent').id;
    setActiveActor(testActorId);

    const issue = createIssue({ title: 'JSON Next', priority: Priority.MEDIUM });

    const exitCode = await nextCommand(['--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.issue.id, issue.id);
    assert.equal(output.issue.status, 'in_progress');
  });

  it('should support --json output when no open issues remain', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    const exitCode = await nextCommand(['--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.issue, null);
  });
});
