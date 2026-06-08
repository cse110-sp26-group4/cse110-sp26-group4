import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { Status, Priority } from '../source/models/issue.js';
import * as schema from '../source/models/schema.js';
import { setTestDB } from '../source/db/index.js';
import { createIssue } from '../source/services/issuesService.js';
import { setCurrentActor } from '../source/services/context.js';
import { registerAgent } from '../source/services/agentsService.js';
import { authenticateContext } from '../source/services/authService.js';
import { run as claimCommand } from '../source/commands/claim.js';

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

describe('Claim Command', () => {
  let sqlite;
  let capture;
  let originalBatonAgent;

  beforeEach(() => {
    originalBatonAgent = process.env.BATON_AGENT;
    capture = captureConsole();
  });

  afterEach(() => {
    capture.restore();
    setCurrentActor(null);
    process.env.BATON_AGENT = originalBatonAgent;
    if (sqlite) {
      sqlite.close();
      sqlite = null;
    }
  });

  it('should fail when the tracker is not initialized', async () => {
    const empty = makeEmptyDb();
    sqlite = empty.sqlite;
    setTestDB(empty.db, empty.sqlite);

    const exitCode = await claimCommand(['1']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors.some((line) => line.includes('No tracker found')));
  });

  it('should fail when the issue ID is missing', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db, setup.sqlite);

    const exitCode = await claimCommand([]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors.some((line) => line.includes('Expected at least 1 positional argument.')));
  });

  it('should fail when the issue ID is not an integer', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db, setup.sqlite);
    process.env.BATON_AGENT = 'agent-1';
    registerAgent('agent-1', 'agent');
    authenticateContext('claim');

    const exitCode = await claimCommand(['abc']);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors.some((line) => line.includes('Invalid ID')));
  });

  it('should fail when the current actor is human', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db, setup.sqlite);

    registerAgent('human-user', 'human');
    process.env.BATON_AGENT = 'human-user';
    authenticateContext('claim');

    const issue = createIssue({ title: 'Open issue', priority: Priority.LOW });
    const exitCode = await claimCommand([String(issue.id)]);

    assert.equal(exitCode, 1);
    assert.ok(capture.errors.some((line) => line.includes('Only an agent may claim an issue')));
  });

  it('should claim an issue for an authenticated agent', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db, setup.sqlite);

    const agent = registerAgent('claimer-agent', 'agent');
    process.env.BATON_AGENT = 'claimer-agent';
    authenticateContext('claim');

    const issue = createIssue({ title: 'Work item', priority: Priority.MEDIUM });
    const exitCode = await claimCommand([String(issue.id)]);

    assert.equal(exitCode, 0);
    assert.ok(capture.logs.some((line) => line.includes(`Success: Issue #${issue.id} claimed by agent "${agent.name}"`)));
  });

  it('should support --json output on success', async () => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    setTestDB(setup.db, setup.sqlite);

    const agent = registerAgent('json-agent', 'agent');
    process.env.BATON_AGENT = 'json-agent';
    authenticateContext('claim');

    const issue = createIssue({ title: 'JSON issue', priority: Priority.HIGH });
    const exitCode = await claimCommand([String(issue.id), '--json']);

    assert.equal(exitCode, 0);
    const output = JSON.parse(capture.logs[0]);
    assert.equal(output.status, 'success');
    assert.equal(output.issue.id, issue.id);
    assert.equal(output.issue.status, 'in_progress');
  });
});
