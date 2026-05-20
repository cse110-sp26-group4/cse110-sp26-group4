import { getDb } from "../db.js";
import {
  Issue,
  ActivityLog,
  Status,
  Priority,
  Action,
} from "../models/issue.js";

/**
 * Internal helper to log actions.
 * @private
 * @param {object} db - The database instance.
 * @param {number} issueId - The ID of the issue.
 * @param {string} action - The action type.
 * @param {string|null} [details=null] - Optional details.
 */
function logActivity(db, issueId, action, details = null) {
  db.prepare(
    `
    INSERT INTO activity (issue_id, action, details)
    VALUES (?, ?, ?)
  `,
  ).run(issueId, action, details);
}

/**
 * Convert a raw database row to an Issue instance.
 * @private
 * @param {object|null} row - The raw database row.
 * @returns {Issue|null}
 */
function rowToIssue(row) {
  return row ? new Issue(row) : null;
}

/**
 * Convert a raw database row to an ActivityLog instance.
 * @private
 * @param {object|null} row - The raw database row.
 * @returns {ActivityLog|null}
 */
function rowToLog(row) {
  return row ? new ActivityLog(row) : null;
}

/**
 * Fetch a raw issue row by ID, throwing if not found.
 * @private
 * @param {object} db - The database instance.
 * @param {number} id - The ID of the issue.
 * @returns {object} The raw database row.
 * @throws {Error} If no issue with the given ID exists.
 */
function findById(db, id) {
  const row = db.prepare(`SELECT * FROM issues WHERE id = ?`).get(id);
  if (!row) throw new Error(`Issue #${id} not found`);
  return row;
}

/**
 * Create a new issue.
 * Title defaults to "Issue #<id>" via SQL trigger if not provided.
 * @param {{ title?: string, priority?: string, tokenLimit?: number, description?: string }} fields
 * @returns {Issue}
 */
export function createIssue({
  title,
  priority = Priority.LOW,
  tokenLimit,
  description,
} = {}) {
  Issue.validate({ title, priority, tokenLimit });

  const db = getDb();
  const result = db
    .prepare(
      `
    INSERT INTO issues (title, priority, token_limit, description)
    VALUES (?, ?, ?, ?)
  `,
    )
    .run(
      title?.trim() || "PENDING",
      priority,
      tokenLimit ?? null,
      description ?? null,
    );

  const issue = rowToIssue(
    db.prepare(`SELECT * FROM issues WHERE id = ?`).get(result.lastInsertRowid),
  );
  logActivity(db, issue.id, Action.CREATION, `"${issue.title}" was created.`);

  return issue;
}

/**
 * Get a single issue by id. Logs a read event.
 * @param {number} id
 * @returns {Issue}
 */
export function getIssue(id) {
  const db = getDb();
  const issue = rowToIssue(findById(db, id));
  logActivity(db, id, Action.READ, `Issue #${id} was accessed.`);
  return issue;
}

/**
 * List issues with optional filters. Does not log activity.
 * @param {{ status?: string, priority?: string, limit?: number, offset?: number }} options
 * @returns {Issue[]}
 */
export function listIssues({ status, priority, limit = 50, offset = 0 } = {}) {}

/**
 * Search issues by title or description. Does not log activity.
 * @param {string} query
 * @returns {Issue[]}
 */
export function searchIssues(query) {}

/**
 * Update editable fields: title, description, tokenLimit.
 * Logs an edit event.
 * @param {number} id
 * @param {{ title?: string, description?: string, tokenLimit?: number }} fields
 * @returns {Issue}
 */
export function updateIssue(id, { title, description, tokenLimit } = {}) {
  const db = getDb();
  if (title !== undefined) {
    db.prepare(`
        UPDATE issues
        SET title = ?
        WHERE id = ?
      `)
      .run(title, id);
  }
  if (description !== undefined) {
    db.prepare(`
        UPDATE issues
        SET description = ?
        WHERE id = ?
      `)
      .run(description, id);
  }
  if (tokenLimit !== undefined) {
    db.prepare(`
        UPDATE issues
        SET token_limit = ?
        WHERE id = ?
      `)
      .run(tokenLimit, id);
  }
  
  return getIssue(id);
}

/**
 * Change the status of an issue (Open / Closed).
 * Logs a state_change event.
 * @param {number} id
 * @param {string} status
 * @returns {Issue}
 */
export function setStatus(id, status) {}

/**
 * Change the priority of an issue (Low / Medium / High).
 * Logs a priority_change event.
 * @param {number} id
 * @param {string} priority
 * @returns {Issue}
 */
export function setPriority(id, priority) {}

/**
 * Increment the attempt counter for an issue.
 * Logs an edit event.
 * @param {number} id
 * @returns {Issue}
 */
export function incrementAttempt(id) {}

/**
 * Delete an issue. Activity log entry is written before deletion
 * to preserve the audit trail per schema spec.
 * @param {number} id
 * @returns {boolean}
 */
export function deleteIssue(id) {
  const db = getDb();
  const existing = findById(db, id);

  logActivity(db, id, Action.DELETION, `"${existing.title}" was deleted.`);
  db.prepare(`DELETE FROM issues WHERE id = ?`).run(id);

  return true;
}

/**
 * Get the full activity history for a specific issue.
 * @param {number} issueId
 * @returns {ActivityLog[]}
 */
export function getActivityLog(issueId) {}

/**
 * Get the most recent activity across all issues.
 * @param {{ limit?: number }} options
 * @returns {ActivityLog[]}
 */
export function getRecentActivity({ limit = 20 } = {}) {}
