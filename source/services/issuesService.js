import  { getDB } from  "../db.js";
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

  const db = getDB();
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
  const db = getDB();
  const issue = rowToIssue(findById(db, id));
  logActivity(db, id, Action.READ, `Issue #${id} was accessed.`);
  return issue;
}

/**
 * Helper function used to format and print Issues in a table
 * @param {Object} issue 
 * @param {{ id: number, title: number, status: number, priority: number, assignee: number }} width
 * @returns {void}
 */
function printIssueTable(issue, width) {
  const idVal = String(issue.id).substring(0, width.id);
  
  let titleVal = String(issue.title || `Issue #${issue.id}`);
  if (titleVal.length > width.title) {
    titleVal = titleVal.substring(0, width.title - 3) + "...";
  }

  const statusVal = String(issue.status || "Open");
  const priorityVal = String(issue.priority || "Low");
  const assigneeVal = String(issue.assignee || "None");

  console.log(
    idVal.padEnd(width.id) + " │ "
    + titleVal.padEnd(width.title) + " │ "
    + statusVal.padEnd(width.status) + " │ "      
    + priorityVal.padEnd(width.priority) + " │ "   
    + assigneeVal.padEnd(width.assignee)        
  );
}

/**
 * List issues with optional filters. Does not log activity.
 * @param {{ status?: string, priority?: string, assignee?: string, limit?: number, offset?: number }} options
 * @returns {Issue[]}
 */
export function listIssues({ status, priority, assignee, limit = 50, offset = 0 } = {}) {
  const db = getDB();

  let query = "SELECT title, status, priority, id, assignee FROM issues WHERE 1=1";
  const param = [];
  const filter = [];

  if (status) {
    filter.push(`status = ?`);
    param.push(filter.status);
  }

  if (priority) {
    filter.push(`priority = ?`);
    param.push(filter.priority);
  }

  if (assignee) {
    filter.push(`assignee = ?`);
    param.push(filter.assignee);
  }

  if (filter.length > 0) {
    query += ` WHERE ` + filter.join(` AND `);
  }

  query += " LIMIT ? OFFSET ?";
  param.push(limit, offset);

  try {
    const statement = db.prepare(query); // 1. Prepare the statement first
    const rows = statement.all(...param);

    if (rows.length == 0) {
      console.log("\nNo issues matching those filters were found.\n");
      return [];
    }

    const width = { id: 5, title: 30, status: 15, priority: 10, assignee: 20 };

    console.log(`Filters: ${JSON.stringify({ status, priority, assignee })}`);
    console.log(
      "\nID #".padEnd(width.id) + " | " 
      + "TITLE".padEnd(width.title) + " | " 
      + "STATUS".padEnd(width.status) + " | " 
      + "PRIORITY".padEnd(width.priority) + " | " 
      + "ASSIGNEE".padEnd(width.assignee)
    );

    console.log (
      "─".repeat(width.id) + "─┼─" 
      + "─".repeat(width.title) + "─┼─" 
      + "─".repeat(width.status) + "─┼─" 
      + "─".repeat(width.priority) + "─┼─" 
      + "─".repeat(width.assignee)
    );

    rows.forEach(issue => printIssueTable(issue, width));
    console.log("\n");

    return rows.map(row => rowToIssue(row));

  } catch (error) {
    console.error("Failed to list issues:", error.message);
    throw error;
  }
}

/**
 * Search issues by title or description. Does not log activity.
 * @param {string} query
 * @returns {Issue[]}
 */
export function searchIssues(query) {
  const db = getDB();

  if (!query || query.trim() == "") {
    console.log("\nSearch query is empty.\n");
    return [];
  }

  const sql = `SELECT title, status, priority, assignee, id FROM issues 
  WHERE title LIKE ? OR description LIKE ?`;

  const searchTerm = `%${query.toLowerCase().trim()}%`;

  try {
    const statement = db.prepare(sql);
    const row = statement.all(query, query);

    if (row.length == 0) {
      console.log(`\nNo issues containing "${searchString}" were found.\n`);
      return [];
    }

    const width = {id: 5, title: 30, status: 15, priority: 10, assignee: 20 };

    console.log(`\nFound ${row.length} issue(s) containing "${query}":\n`);
    console.log(
      "ID".padEnd(width.id) + " │ " 
      + "TITLE".padEnd(width.title) + " │ " 
      + "STATUS".padEnd(width.status) + " │ " 
      + "PRIORITY".padEnd(width.priority) + " │ " 
      + "ASSIGNEE".padEnd(width.assignee)
    );

    console.log(
      "─".repeat(width.id) + "─┼─" 
      + "─".repeat(width.title) + "─┼─" 
      + "─".repeat(width.status) + "─┼─" 
      + "─".repeat(width.priority) + "─┼─" 
      + "─".repeat(width.assignee)
    );

    row.forEach(issue => printIssueTable(issue, width));

    console.log("\n");

    return row.map(row => rowToIssue(row));
  } catch (error) {
    console.error("Search failed:", error.message);
    throw error;
  }
}

/**
 * Update editable fields: title, description, tokenLimit.
 * Logs an edit event.
 * @param {number} id
 * @param {{ title?: string, description?: string, tokenLimit?: number }} fields
 * @returns {Issue}
 */
export function updateIssue(id, { title, description, tokenLimit } = {}) {
  const db = getDB();
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
  logActivity(db, id, Action.EDIT, `Issue #${id} was updated.`);
  return getIssue(id);
}

/**
 * Change the status of an issue from in-review to closed
 * Logs a closed event.
 * @param {number} id
 * @returns {Issue}
 */
export function approveIssue(id) {
  const db = getDB();
  const status = 'Closed';
  db.prepare(`
    UPDATE issues
    SET status = ?
    WHERE id = ?
  `).run(status, id);
  logActivity(db, id, Action.STATE_CHANGE, `Issue #${id} has been closed`);
  return getIssue(id);
}

/**
 * Change the status of an issue from in-review to in-progress
 * Logs a reject event and reason.
 * @param {number} id
 * @param {string} reason
 * @returns {Issue}
 */
export function rejectIssue(id, reason) {
  const db = getDB();
  const status = 'In-Progress';
  db.prepare(`
    UPDATE issues
    SET status = ?
    WHERE id = ?
  `).run(status, id);
  logActivity(db, id, Action.REJECT, `Issue #${id} has been rejected due to "${reason}"`);
  return getIssue(id);
}

/**
 * Change the status of an issue (Open / Closed).
 * Logs a state_change event.
 * @param {number} id
 * @param {string} status
 * @returns {Issue}
 */
export function setStatus(id, status) {
  const db = getDB();
  db.prepare(`
    UPDATE issues
    SET status = ?
    WHERE id = ?
  `).run(status, id);
  logActivity(db, id, Action.STATE_CHANGE, `Issue #${id} status changed to ${status}.`);
  return getIssue(id);
}

/**
 * Change the priority of an issue (Low / Medium / High).
 * Logs a priority_change event.
 * @param {number} id
 * @param {string} priority
 * @returns {Issue}
 */
export function setPriority(id, priority) {
  const db = getDB();
  db.prepare(`
    UPDATE issues
    SET priority = ?
    WHERE id = ?
  `).run(priority, id);
  logActivity(db, id, Action.PRIORITY_CHANGE, `Issue #${id} priority changed to ${priority}.`);
  return getIssue(id);
}

/**
 * Increment the attempt counter for an issue.
 * Logs an edit event.
 * @param {number} id
 * @returns {Issue}
 */
export function incrementAttempt(id) {
  const db = getDB();
  db.prepare(`
    UPDATE issues
    SET attempt_num = attempt_num + 1
    WHERE id = ?
  `).run(id);
  logActivity(db, id, Action.EDIT, `Attempt count increased for Issue #${id}.`);
  return getIssue(id);
}

/**
 * Delete an issue. Activity log entry is written before deletion
 * to preserve the audit trail per schema spec.
 * @param {number} id
 * @returns {boolean}
 */
export function deleteIssue(id) {
  const db = getDB();
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
