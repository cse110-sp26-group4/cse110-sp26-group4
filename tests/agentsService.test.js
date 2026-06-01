import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import * as schema from '../source/models/schema.js';
import { agentsTable } from '../source/models/schema.js';

import { setTestDB } from '../source/db/index.js'; 
import { registerAgent, getAgentByName } from '../source/services/agentsService.js';

// ─── Test Helpers ────────────────────────────────────────────────────────────

/**
 * Creates an in-memory SQLite database, applies migrations, and returns the Drizzle instance.
 * @returns {{ sqlite: Database, db: ReturnType<typeof drizzle> }}
 */
function makeDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.join(process.cwd(), 'drizzle');
  
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
  } else {
    throw new Error("Migrations folder not found! Run 'npx drizzle-kit generate' before running tests.");
  }

  // Included the same triggers as the main database setup for schema consistency
  sqlite.exec(`
    CREATE TRIGGER IF NOT EXISTS set_default_issue_title
    AFTER INSERT ON issues
    FOR EACH ROW
    WHEN NEW.title = 'PENDING' OR NEW.title IS NULL
    BEGIN
      UPDATE issues
      SET title = 'Issue #' || NEW.id
      WHERE id = NEW.id;
    END;
  `);

  sqlite.exec(`
   CREATE TRIGGER IF NOT EXISTS update_last_updated
   AFTER UPDATE ON issues
   FOR EACH ROW
   WHEN NEW.last_updated IS OLD.last_updated
   BEGIN
    UPDATE issues
    SET last_updated = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
  END;
  `);

  return { sqlite, db };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Agents Service Operations', () => {
  let sqlite;
  let testDb;

  beforeEach(() => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    testDb = setup.db;
    
    // Inject the in-memory database into the application
    setTestDB(testDb);
  });

  afterEach(() => {
    sqlite.close();
  });

  // ── registerAgent ──────────────────────────────────────────────────────────

  describe('registerAgent', () => {
    it('should successfully register an AI agent and return an Agent instance', () => {
      const agent = registerAgent('claude-dev', 'agent');

      assert.ok(agent.id);
      assert.equal(agent.name, 'claude-dev');
      assert.equal(agent.type, 'agent');
      assert.ok(agent.createdAt);

      // Verify it actually inserted into the database
      const rows = testDb.select().from(agentsTable).all();
      assert.equal(rows.length, 1);
      assert.equal(rows[0].name, 'claude-dev');
    });

    it('should successfully register a human user', () => {
      const agent = registerAgent('rohaan', 'human');

      assert.equal(agent.name, 'rohaan');
      assert.equal(agent.type, 'human');
    });

    it('should throw an error if attempting to register a duplicate name', () => {
      registerAgent('duplicate-bot', 'agent');

      assert.throws(
        () => registerAgent('duplicate-bot', 'agent'),
        // better-sqlite3 throws a specific UNIQUE constraint error
        (err) => err.message.includes('UNIQUE constraint failed: agents.name')
      );
    });
  });

  // ── getAgentByName ─────────────────────────────────────────────────────────

  describe('getAgentByName', () => {
    beforeEach(() => {
      // Seed the in-memory database with a couple of agents before these tests
      registerAgent('gpt-4o', 'agent');
      registerAgent('admin-user', 'human');
    });

    it('should retrieve an existing agent by their exact name', () => {
      const agent = getAgentByName('gpt-4o');

      assert.ok(agent);
      assert.equal(agent.name, 'gpt-4o');
      assert.equal(agent.type, 'agent');
    });

    it('should return null if the agent name does not exist', () => {
      const agent = getAgentByName('missing-bot');
      
      assert.equal(agent, null);
    });
  });
});