import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';

import { Status, Priority } from '../source/models/issue.js';
import { Action } from '../source/models/activityLog.js';
import * as schema from '../source/models/schema.js';
import { activityTable, issuesTable } from '../source/models/schema.js';

import { setTestDB } from '../source/db/index.js'; 

import {
  createIssue, getIssue, listIssues, searchIssues, updateIssue,
  approveIssue, rejectIssue, submitForReview, setStatus, setPriority,
  incrementAttempt, deleteIssue, getActivityLog, getRecentActivity,
  isTrackerReady, getIssueStats, getAllIssues, selectNextIssue,
  workOnIssue, clearAllIssues
} from '../source/services/issuesService.js';

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

describe('Issue Tracker Operations', () => {
  let sqlite;
  let testDb;

  beforeEach(() => {
    const setup = makeDb();
    sqlite = setup.sqlite;
    testDb = setup.db;
    
    // Inject the in-memory database into the application
    // This forces getDB() inside issuesService to return this instance.
    setTestDB(testDb);
  });

  afterEach(() => {
    sqlite.close();
  });

  // ── createIssue ────────────────────────────────────────────────────────────

  describe('createIssue', () => {
    it('should create an issue with default values and log creation', () => {
      const issue = createIssue();

      assert.ok(issue.id);
      // Validates that our trigger successfully updated 'PENDING' to 'Issue #<id>'
      assert.equal(issue.title, `Issue #${issue.id}`); 
      assert.equal(issue.priority, Priority.LOW);

      const logs = testDb.select().from(activityTable).all();
      assert.equal(logs.length, 1);
      assert.equal(logs[0].action, Action.CREATION);
      assert.equal(logs[0].issueId, issue.id);
    });

    it('should create an issue with provided values', () => {
      const issue = createIssue({
        title: 'Fix Login',
        priority: Priority.HIGH,
        tokenLimit: 500,
        description: 'Login page crashes',
      });

      assert.equal(issue.title, 'Fix Login');
      assert.equal(issue.priority, Priority.HIGH);
      assert.equal(issue.tokenLimit, 500);
      assert.equal(issue.description, 'Login page crashes');
    });
  });

  // ── getIssue ───────────────────────────────────────────────────────────────

  describe('getIssue', () => {
    it('should retrieve an existing issue and log a READ action', () => {
      const { id } = createIssue({ title: 'Read Test' });
      const issue = getIssue(id);

      assert.equal(issue.title, 'Read Test');

      const logs = testDb.select().from(activityTable).all();
      assert.ok(logs.some(l => l.action === Action.READ && l.issueId === id));
    });

    it('should throw if the issue does not exist', () => {
      assert.throws(
        () => getIssue(999),
        { message: 'Issue #999 not found' }
      );
    });
  });

  // ── listIssues & searchIssues ──────────────────────────────────────────────

  describe('listIssues & searchIssues', () => {
    beforeEach(() => {
      createIssue({ title: 'Bug 1', priority: Priority.HIGH });
      createIssue({ title: 'Bug 2', priority: Priority.LOW });
      createIssue({ title: 'Feature 1', description: 'Cool feature' });
    });

    it('should filter by priority', async () => {
      const issues = await listIssues({ priority: Priority.HIGH });
      assert.equal(issues.length, 1);
      assert.equal(issues[0].title, 'Bug 1');
    });

    it('should paginate results', async () => {
      const issues = await listIssues({ limit: 2, offset: 0 });
      assert.equal(issues.length, 2);
    });

    it('should search by title', () => {
      const results = searchIssues('Bug');
      assert.equal(results.length, 2);
    });

    it('should search by description', () => {
      const results = searchIssues('Cool');
      assert.equal(results.length, 1);
      assert.equal(results[0].title, 'Feature 1');
    });
  });

  // ── State Changes ──────────────────────────────────────────────────────────

  describe('State Change Operations', () => {
    let issueId;

    beforeEach(() => {
      issueId = createIssue({ title: 'State Test' }).id;
    });

    it('should approve an issue', () => {
      const issue = approveIssue(issueId);
      assert.equal(issue.status, Status.CLOSED);
      const logs = getActivityLog(issueId);
      assert.ok(logs.some(l => l.action === Action.STATE_CHANGE));
    });

    it('should reject an issue with reason', () => {
      const issue = rejectIssue(issueId, 'Fails tests');
      assert.equal(issue.status, Status.IN_PROGRESS);
      const rejectLog = getActivityLog(issueId).find(l => l.action === Action.REJECT);
      assert.ok(rejectLog.details.includes('Fails tests'));
    });

    it('should submit for review', () => {
      const issue = submitForReview(issueId);
      assert.equal(issue.status, Status.IN_REVIEW);
    });
  });

  // ── workOnIssue ────────────────────────────────────────────────────────────

  describe('workOnIssue', () => {
    it('should mark IN_PROGRESS, increment attempts, and log atomically', () => {
      const { id } = createIssue({ title: 'Work Test' });
      const issue = workOnIssue(id);

      assert.equal(issue.status, Status.IN_PROGRESS);
      assert.equal(issue.attemptNum, 1);

      const actions = getActivityLog(id).map(l => l.action);
      assert.ok(actions.includes(Action.CREATION));
      assert.ok(actions.includes(Action.READ));
      assert.ok(actions.includes(Action.STATE_CHANGE));
      assert.ok(actions.includes(Action.EDIT));
    });

    it('should throw when working on a CLOSED issue', () => {
      const { id } = createIssue({ title: 'Closed Work Test' });
      approveIssue(id);

      assert.throws(
        () => workOnIssue(id),
        { message: `Issue #${id} is closed and cannot be worked on.` }
      );
    });
  });

  // ── Tracker Operations ─────────────────────────────────────────────────────

  describe('Tracker Operations', () => {
    it('isTrackerReady should return true when tables exist', () => {
      assert.equal(isTrackerReady(), true);
    });

    it('isTrackerReady should return false when tables are missing', () => {
      sqlite.exec('DROP TABLE issues; DROP TABLE activity;');
      assert.equal(isTrackerReady(), false);
    });

    it('getIssueStats should accurately count statuses', () => {
      createIssue();
      createIssue();
      const { id } = createIssue();
      approveIssue(id);

      const stats = getIssueStats();
      assert.equal(stats.total, 3);
      assert.equal(stats.open, 2);
      assert.equal(stats.closed, 1);
    });

    it('selectNextIssue should prioritize High over Low', () => {
      createIssue({ title: 'Low Priority', priority: Priority.LOW });
      createIssue({ title: 'High Priority', priority: Priority.HIGH });

      const next = selectNextIssue();
      assert.equal(next.title, 'High Priority');
    });
  });

  // ── Deletions ──────────────────────────────────────────────────────────────

  describe('Deletions and Clear', () => {
    it('deleteIssue should remove issue but preserve the audit log', () => {
      const { id } = createIssue({ title: 'To Delete' });
      const success = deleteIssue(id);

      assert.equal(success, true);
      assert.throws(() => getIssue(id), { message: `Issue #${id} not found` });

      const logs = testDb.select().from(activityTable).all();
      assert.ok(logs.some(l => l.action === Action.DELETION));
    });

    it('clearAllIssues should wipe all issues', () => {
      createIssue();
      createIssue();
      clearAllIssues();
      assert.equal(getAllIssues().length, 0);
    });
  });
});