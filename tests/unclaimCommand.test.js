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
import { run as unclaimCommand } from '../source/commands/unclaim.js';

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

describe('Unclaim Command', () => {
  let sqlite;
  let testDb;
  let capture;
  let agent;

  beforeEach(() => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    testDb = setup.db;
    setTestDB(testDb, sqlite);
    agent = registerAgent('claude-dev', 'agent');
    setCurrentActor(agent);
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    setCurrentActor(null);
    sqlite.close();
  });

  it('should successfully unclaim an issue assigned to the current agent', async () => {
    const issue = createIssue({ title: 'Claimable Issue' });
    claimIssue(issue.id);

    const exitCode = await unclaimCommand([String(issue.id)]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes(`Issue #${issue.id} released by agent "claude-dev"`));
    assert.ok(capture.logs[0].includes('returned to Open'));

    const updated = getIssue(issue.id);
    assert.equal(updated.status, Status.OPEN);
    assert.equal(updated.assigneeId, null);
  });

  it('should fail if no issue ID is provided', async () => {
    const exitCode = await unclaimCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Expected at least 1 positional argument'));
  });

  it('should fail if the ID is not a positive integer', async () => {
    const exitCode = await unclaimCommand(['abc']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('ID must be a positive integer'));
  });

  it('should fail if the issue does not exist', async () => {
    const exitCode = await unclaimCommand(['9999']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Issue #9999 not found'));
  });

  it('should fail if the current actor is not the assignee', async () => {
    const issue = createIssue({ title: 'Someone Elses Issue' });
    claimIssue(issue.id);

    const otherAgent = registerAgent('other-agent', 'agent');
    setCurrentActor(otherAgent);

    const exitCode = await unclaimCommand([String(issue.id)]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('not assigned to you'));
  });

  it('should fail if the current actor is a human, not an agent', async () => {
    const issue = createIssue({ title: 'Human Tries to Unclaim' });
    claimIssue(issue.id);

    const humanActor = registerAgent('alice', 'human');
    setCurrentActor(humanActor);

    const exitCode = await unclaimCommand([String(issue.id)]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Only agents can unclaim issues'));
  });

  it('should fail if the issue has no assignee', async () => {
    const issue = createIssue({ title: 'Unassigned Issue' });

    const exitCode = await unclaimCommand([String(issue.id)]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('not assigned to you'));
  });

  it('should support --json output on success', async () => {
    const issue = createIssue({ title: 'JSON Unclaim' });
    claimIssue(issue.id);

    const exitCode = await unclaimCommand([String(issue.id), '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.issue.id, issue.id);
    assert.equal(output.issue.status, 'open');
  });

  it('should support --json output on error (not found)', async () => {
    const exitCode = await unclaimCommand(['9999', '--json']);

    assert.equal(exitCode, 1);
    const output = JSON.parse(capture.errors[0]);
    assert.equal(output.status, 'error');
    assert.equal(output.code, 'NOT_FOUND');
  });

  it('should support --json output on error (not assignee)', async () => {
    const issue = createIssue({ title: 'Not Mine' });
    claimIssue(issue.id);

    const stranger = registerAgent('stranger', 'agent');
    setCurrentActor(stranger);

    const exitCode = await unclaimCommand([String(issue.id), '--json']);

    assert.equal(exitCode, 1);
    const output = JSON.parse(capture.errors[0]);
    assert.equal(output.status, 'error');
    assert.equal(output.code, 'FORBIDDEN');
  });

  it('should support --json output on error (human actor)', async () => {
    const bob = registerAgent('bob', 'human');
    setCurrentActor(bob);
    const issue = createIssue({ title: 'Human Error' });

    const exitCode = await unclaimCommand([String(issue.id), '--json']);

    assert.equal(exitCode, 1);
    const output = JSON.parse(capture.errors[0]);
    assert.equal(output.status, 'error');
    assert.equal(output.code, 'FORBIDDEN');
  });

  it('should print help and exit 0 with --help', async () => {
    const exitCode = await unclaimCommand(['--help']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes('baton unclaim'));
  });

  it('should print help and exit 0 with -h', async () => {
    const exitCode = await unclaimCommand(['-h']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes('baton unclaim'));
  });
});
