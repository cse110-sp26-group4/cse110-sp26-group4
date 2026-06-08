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
import {
  createIssue,
  claimIssue,
  getIssue,
} from '../source/services/issuesService.js';
import { setCurrentActor } from '../source/services/context.js';
import { registerAgent } from '../source/services/agentsService.js';
import { run as submitCommand } from '../source/commands/submit.js';

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

describe('Submit Command', () => {
  let sqlite;
  let testDb;
  let capture;
  /** @type {object} */
  let testActor;

  beforeEach(() => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    testDb = setup.db;
    setTestDB(testDb, sqlite);
    testActor = registerAgent('test-agent', 'agent');
    setCurrentActor(null);
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    setCurrentActor(null);
    sqlite.close();
  });

  it('should successfully submit an In-Progress issue for review', async () => {
    setCurrentActor(testActor);
    const issue = createIssue({ title: 'Submit Me' });
    claimIssue(issue.id);

    const exitCode = await submitCommand([String(issue.id)]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes(`Success: Issue #${issue.id} submitted for review.`));

    const updated = getIssue(issue.id);
    assert.equal(updated.status, Status.IN_REVIEW);
  });

  it('should fail if the issue is not In-Progress', async () => {
    const issue = createIssue({ title: 'Open Issue' });
    setCurrentActor(testActor);

    const exitCode = await submitCommand([String(issue.id)]);

    assert.equal(exitCode, 1);
    assert.ok(
      capture.errors[0].includes(
        `Only issues in "${Status.IN_PROGRESS}" can be submitted for review.`,
      ),
    );
  });

  it('should fail if the issue does not exist', async () => {
    setCurrentActor(testActor);

    const exitCode = await submitCommand(['999']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Issue #999 not found'));
  });

  it('should fail if no issue ID is provided', async () => {
    setCurrentActor(testActor);

    const exitCode = await submitCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Expected at least 1 positional argument.'));
  });

  it('should fail if the ID is not an integer', async () => {
    setCurrentActor(testActor);

    const exitCode = await submitCommand(['abc']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('ID must be a positive integer'));
  });

  it('should support --json output on success', async () => {
    setCurrentActor(testActor);
    const issue = createIssue({ title: 'JSON Submit' });
    claimIssue(issue.id);

    const exitCode = await submitCommand([String(issue.id), '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.issue.id, issue.id);
    assert.equal(output.issue.status, 'in_review');
  });

  it('should support --json output on error', async () => {
    setCurrentActor(testActor);

    const exitCode = await submitCommand(['999', '--json']);

    assert.equal(exitCode, 1);
    const output = JSON.parse(capture.errors[0]);
    assert.equal(output.status, 'error');
    assert.equal(output.code, 'NOT_FOUND');
  });
});
