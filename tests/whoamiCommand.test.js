import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js';
import { authenticateContext } from '../source/services/authService.js';
import { registerAgent } from '../source/services/agentsService.js';
import { run as whoamiCommand } from '../source/commands/whoami.js';

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

describe('Whoami Command', () => {
  let sqlite;
  let capture;
  let originalBatonAgent;

  beforeEach(() => {
    originalBatonAgent = process.env.BATON_AGENT;
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    process.env.BATON_AGENT = originalBatonAgent;
    if (sqlite) {
      sqlite.close();
      sqlite = null;
    }
  });

  it('should display the authenticated agent', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    registerAgent('claude-dev', 'agent');
    process.env.BATON_AGENT = 'claude-dev';
    authenticateContext('whoami');

    const exitCode = await whoamiCommand([]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes('Active Agent: "claude-dev" (ID: 1, Type: agent)')));
  });

  it('should output JSON when --json is provided', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db);

    registerAgent('json-agent', 'agent');
    process.env.BATON_AGENT = 'json-agent';
    authenticateContext('whoami');

    const exitCode = await whoamiCommand(['--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.actor.name, 'json-agent');
    assert.equal(output.actor.type, 'agent');
  });
});
