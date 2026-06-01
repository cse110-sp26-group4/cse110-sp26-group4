import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js'; 
import { createIssue, getIssue } from '../source/services/issuesService.js';
import { run as deleteCommand } from '../source/commands/delete.js';

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

// Mocking @inquirer/prompts confirm
// Since we can't easily mock ESM imports in Node.js test runner without extra libraries,
// we will rely on --yes and --json flags to skip the prompt in most tests.
// For the "cancellation" test, we would ideally mock confirm to return false.
// Given the constraints, I'll focus on the flags.

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Delete Command', () => {
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

  it('should successfully delete an issue with --yes', async () => {
    const issue = createIssue({ title: 'Delete Me' });
    const id = issue.id;

    const exitCode = await deleteCommand([String(id), '--yes']);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs[0].includes(`Issue #${id} deleted successfully`));
    
    // Verify deletion
    assert.throws(() => getIssue(id), { message: `Issue #${id} not found` });
  });

  it('should fail if the issue does not exist', async () => {
    const exitCode = await deleteCommand(['999', '--yes']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('Issue #999 not found'));
  });

  it('should support --json output on success', async () => {
    const issue = createIssue({ title: 'Delete Me' });
    const id = issue.id;

    const exitCode = await deleteCommand([String(id), '--yes', '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.id, id);
  });

  it('should fail in JSON mode without --yes', async () => {
    const issue = createIssue({ title: 'Delete Me' });
    const id = issue.id;

    const exitCode = await deleteCommand([String(id), '--json']);

    assert.equal(exitCode, 1);
    const output = JSON.parse(capture.errors[0]);
    assert.equal(output.status, 'error');
    assert.equal(output.code, 'CONFIRMATION_REQUIRED');
  });

  it('should fail if ID is not an integer', async () => {
    const exitCode = await deleteCommand(['abc', '--yes']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('ID must be an integer'));
  });

  it('should fail if no ID is provided', async () => {
    const exitCode = await deleteCommand(['--yes']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors[0].includes('No ID provided'));
  });
});