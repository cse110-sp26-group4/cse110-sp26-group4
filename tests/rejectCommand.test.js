import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import { Status } from '../source/models/issue.js';
import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js'; 
import { createIssue, submitForReview } from '../source/services/issuesService.js';
import { run as rejectCommand } from '../source/commands/reject.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
  } else {
    throw new Error("Migrations folder not found!");
  }

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

describe('Reject Command', () => {
  let sqlite;
  let testDb;
  let capture;

  beforeEach(() => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    testDb = setup.db;
    setTestDB(testDb);
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    sqlite.close();
  });

  it('should successfully reject an In-Review issue', async () => {
    const issue = createIssue({ title: 'Test Issue' });
    submitForReview(issue.id);

    const exitCode = await rejectCommand([String(issue.id), '--reason', 'Test Reason']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes(`Issue #${issue.id} rejected successfully`));
    assert.ok(capture.logs[0].includes('In-Progress'));
  });

  it('should fail if the issue is not In-Review', async () => {
    const issue = createIssue({ title: 'Test Issue' });
    // Issue is currently "Open"

    const exitCode = await rejectCommand([String(issue.id), '--reason', 'Test Reason']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Only issues in "In-Review" status can be rejected'));
  });

  it('should fail if the issue does not exist', async () => {
    const exitCode = await rejectCommand(['999', '--reason', 'Test Reason']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Issue #999 not found'));
  });

  it('should fail if --reason is missing', async () => {
    const exitCode = await rejectCommand(['1']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Missing reason for reject'));
  });

  it('should fail if --reason is empty', async () => {
    const exitCode = await rejectCommand(['1', '--reason', '']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Reason for rejection cannot be empty'));
  });

  it('should support --json output on success', async () => {
    const issue = createIssue({ title: 'Test Issue' });
    submitForReview(issue.id);

    const exitCode = await rejectCommand([String(issue.id), '--reason', 'Test Reason', '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.issue.id, issue.id);
    assert.equal(output.issue.status, 'in_progress');
  });

  it('should support --json output on error', async () => {
    const exitCode = await rejectCommand(['999', '--reason', 'Test Reason', '--json']);

    assert.equal(exitCode, 1);
    const output = JSON.parse(capture.errors[0]);
    assert.equal(output.status, 'error');
    assert.equal(output.code, 'NOT_FOUND');
  });

  it('should handle multi-word reasons without quotes', async () => {
    const issue = createIssue({ title: 'Test Issue' });
    submitForReview(issue.id);

    // Baton's getFlagValue handles multi-word if they are subsequent args
    const exitCode = await rejectCommand([String(issue.id), '--reason', 'This', 'is', 'a', 'long', 'reason']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes(`Issue #${issue.id} rejected successfully`));
  });
});