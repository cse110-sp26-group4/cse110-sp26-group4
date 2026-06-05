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
  claimIssue,
  submitForReview,
} from '../source/services/issuesService.js';
import { setCurrentActor } from '../source/services/context.js';
import { registerAgent } from '../source/services/agentsService.js';
import { run as statusCommand } from '../source/commands/status.js';

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

describe('Status Command', () => {
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

    const exitCode = await statusCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('No tracker found'));
  });

  it('should report zero progress when there are no issues', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    const exitCode = await statusCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Total issues:     0')));
    assert.ok(capture.logs.some((line) => line.includes('Overall progress: 0% complete')));
  });

  it('should report counts across all statuses', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);
    testActor = registerAgent('status-agent', 'agent');
    setCurrentActor(testActor);

    const openIssue = createIssue({ title: 'Open', priority: Priority.HIGH });
    const inProgress = createIssue({ title: 'Working' });
    claimIssue(inProgress.id);
    const inReview = createIssue({ title: 'Review' });
    claimIssue(inReview.id);
    submitForReview(inReview.id);
    const closed = createIssue({ title: 'Done' });
    approveIssue(closed.id);

    const exitCode = await statusCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Total issues:     4')));
    assert.ok(capture.logs.some((line) => line.includes('Open:             1')));
    assert.ok(capture.logs.some((line) => line.includes('In progress:      1')));
    assert.ok(capture.logs.some((line) => line.includes('In review:        1')));
    assert.ok(capture.logs.some((line) => line.includes('Closed:           1')));
    assert.ok(capture.logs.some((line) => line.includes('Overall progress: 25% complete')));
    assert.ok(capture.logs.some((line) => line.includes('High:   1')));
  });

  it('should only count open issues in the priority breakdown', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    createIssue({ title: 'Open High', priority: Priority.HIGH });
    const closedHigh = createIssue({ title: 'Closed High', priority: Priority.HIGH });
    approveIssue(closedHigh.id);

    const exitCode = await statusCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('High:   1')));
    assert.ok(capture.logs.some((line) => line.includes('Medium: 0')));
  });

  it('should support --json output', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    createIssue({ title: 'JSON Status', priority: Priority.LOW });

    const exitCode = await statusCommand(['--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.stats.total, 1);
    assert.equal(output.stats.open, 1);
    assert.equal(output.stats.progress_percent, 0);
    assert.deepEqual(output.open_by_priority, { high: 0, medium: 0, low: 1 });
  });
});
