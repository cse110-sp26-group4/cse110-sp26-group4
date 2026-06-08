import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js';
import { registerAgent } from '../source/services/agentsService.js';
import { run as agentsCommand } from '../source/commands/agents.js';

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

describe('Agents Command', () => {
  let sqlite;
  let testDb;
  let capture;

  beforeEach(() => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    testDb = setup.db;
    setTestDB(testDb, sqlite);
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    sqlite.close();
  });

  it('should report when no agents are registered', async () => {
    const exitCode = await agentsCommand([]);

    assert.equal(exitCode, 0);
    assert.equal(capture.logs.length, 1);
    assert.ok(capture.logs[0].includes('No registered agents or humans found.'));
  });

  it('should list registered agents in a table', async () => {
    registerAgent('rohaan', 'human');
    registerAgent('claude-dev', 'agent');

    const exitCode = await agentsCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('ID') && line.includes('Name')));
    assert.ok(capture.logs.some((line) => line.includes('rohaan') && line.includes('human')));
    assert.ok(capture.logs.some((line) => line.includes('claude-dev') && line.includes('agent')));
  });

  it('should support --json output', async () => {
    registerAgent('rohaan', 'human');
    registerAgent('claude-dev', 'agent');

    const exitCode = await agentsCommand(['--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.count, 2);
    assert.deepEqual(output.agents, [
      { id: 1, name: 'rohaan', type: 'human' },
      { id: 2, name: 'claude-dev', type: 'agent' },
    ]);
  });

  it('should support --json output when empty', async () => {
    const exitCode = await agentsCommand(['--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.count, 0);
    assert.deepEqual(output.agents, []);
  });

  it('should return error code 1 on unknown flags', async () => {
    const exitCode = await agentsCommand(['--foo']);
    assert.equal(exitCode, 1);
    assert.ok(capture.errors.some((line) => line.includes('Unknown flag: --foo')));
  });
});
