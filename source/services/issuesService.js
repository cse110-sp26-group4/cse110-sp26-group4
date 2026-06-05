import { getDB } from '../db/index.js';
import { eq, and, or, like, sql } from "drizzle-orm";
import {issuesTable, activityTable} from "../models/schema.js";
import {
  Issue,
  Status,
  Priority,
} from "../models/issue.js";
import { ActivityLog, Action } from '../models/activityLog.js';
import { getCurrentActorId } from './context.js';

/**
 * Internal helper to log actions.
 * @private
 * @param {object} db - The database instance.
 * @param {number} issueId - The ID of the issue.
 * @param {string} action - The action type.
 * @param {string|null} [details=null] - Optional details.
 */
function logActivity(db, issueId, action, details = null) {
  db.insert(activityTable)
    .values({ issueId, action, details, actorId: getCurrentActorId() })
    .run();
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
  const row = db.select()
    .from(issuesTable)
    .where(eq(issuesTable.id, id))
    .get();
  if (!row) throw new Error(`Issue #${id} not found`);
  return row;
}

/**
 * @typedef {Object} CreateIssueFields
 * @property {string} [title] - The title of the issue.
 * @property {string} [priority] - The priority level.
 * @property {number} [tokenLimit] - The maximum token limit for the issue.
 * @property {string} [description] - The detailed description of the issue.
 * @property {number} [assigneeId] - The assigned agent ID.
 */

/**
 * Create a new issue.
 * Title defaults to "Issue #<id>" via SQL trigger if not provided.
 * @param {CreateIssueFields} fields - The fields to initialize the issue with.
 * @returns {Issue}
 */
export function createIssue({
  title,
  priority,
  tokenLimit,
  description,
  assigneeId,
} = {}) {

  const db = getDB();

  // Normalize priority argument
  if (priority !== undefined) {
    const priorityValues = Object.values(Priority);
    const match = priorityValues.find(v => v.toLowerCase() === priority.trim().toLowerCase());
    priority = match || priority;
  }
  
  // Validate before inserting
  const proposed = new Issue({ title, priority, tokenLimit, description, assigneeId });
  const { isValid, errors } = proposed.validate();
  if (!isValid) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const result = db.insert(issuesTable)
    .values({
      title: title?.trim() || "PENDING",
      priority: priority ?? Priority.LOW,
      tokenLimit: tokenLimit ?? null,
      description: description ?? null,
      assigneeId: assigneeId ?? null,
    })
    .returning({ id: issuesTable.id })
    .get();

  // re-fetch the issue to get auto-generated fields back
  const issue = rowToIssue(findById(db, result.id));
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
 * @typedef {Object} ListIssuesOptions
 * @property {string} [status] - Filter issues by their current status.
 * @property {string} [priority] - Filter issues by their priority level.
 * @property {number} [limit] - Maximum number of issues to return.
 * @property {number} [offset] - Pagination offset.
 * @property {number} [assigneeId] - Filter by assigned agent.
 */

/**
 * List issues with optional filters. Does not log activity.
 * @param {ListIssuesOptions} options - Filtering and pagination options.
 * @returns {Issue[]}
 */
export async function listIssues({ status, priority, limit, offset, assigneeId } = {}) {
  const db = getDB();
  const filters = [];

  
  if (status) {
    filters.push(sql`${issuesTable.status} COLLATE NOCASE = ${status}`);
  }
  
  if (priority) {
    filters.push(sql`${issuesTable.priority} COLLATE NOCASE = ${priority}`);
  }

  if (assigneeId !== undefined) {
    filters.push(eq(issuesTable.assigneeId, assigneeId));
  }

  // set defaults if limit or offset is NULL
  const limitVal = limit ?? 50;
  const offsetVal = offset ?? 0;

  return db.select()
    .from(issuesTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .limit(limitVal)
    .offset(offsetVal)
    .all();
}

/**
 * Search issues by title or description. Does not log activity.
 * @param {string} query
 * @returns {Issue[]}
 */
export function searchIssues(query) {
  const db = getDB();

  if (!query || query.trim() == "") {
    return [];
  }

  const searchTerm = `%${query.toLowerCase().trim()}%`;

  return db.select()
    .from(issuesTable)
    .where(
      or(
        like(issuesTable.title, searchTerm),
        like(issuesTable.description, searchTerm)
      )
    )
    .all();
}

/**
 * @typedef {Object} UpdateIssueFields
 * @property {string} [title] - The updated title.
 * @property {string} [description] - The updated description.
 * @property {number} [tokenLimit] - The updated token limit.
 * @property {string} [status] - The updated status.
 * @property {string} [priority] - The updated priority.
 * @property {number} [assigneeId] - The updated assignee ID.
 */

/**
 * Update editable fields: title, description, tokenLimit, status, priority.
 * Logs an edit event.
 * @param {number} id
 * @param {Issue} oldIssue - The current data
 * @param {UpdateIssueFields} fields - The fields to update.
 * @returns {Issue}
 */
export function updateIssue(id, oldIssue, { title, description, tokenLimit, status, priority, assigneeId } = {}) {
  const db = getDB();
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (tokenLimit !== undefined) updates.tokenLimit = tokenLimit;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId;

  // Normalize status argument
  if (status !== undefined) {
    const statusValues = Object.values(Status);
    const toUpdate = statusValues.find(v => v.trim().toLowerCase() === status.trim().toLowerCase());
    updates.status = toUpdate || status;
  }

  // Normalize priority argument
  if (priority !== undefined) {
    const priorityValues = Object.values(Priority);
    const toUpdate = priorityValues.find(v => v.toLowerCase().trim() === priority.trim().toLowerCase());
    updates.priority = toUpdate || priority;
  }

  // Validate the new data 
  const proposedIssue = new Issue({ ...oldIssue, ...updates });
  const { isValid, errors } = proposedIssue.validate();
  
  if (!isValid) {
    throw new Error(`Validation failed: ${errors.join(", ")}`);
  }

  if (Object.keys(updates).length > 0) {
    db.update(issuesTable)
      .set(updates)
      .where(eq(issuesTable.id, id))
      .run();
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
  db.update(issuesTable).set({ status: Status.CLOSED }).where(eq(issuesTable.id, id)).run();
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
  db.update(issuesTable).set({ status: Status.IN_PROGRESS }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.REJECT, `Issue #${id} has been rejected due to "${reason}"`);
  return getIssue(id);
}

/**
 * Change the status of an issue from in-progress to in-review.
 * Logs a state_change event attributed to the current actor.
 * @param {number} issueId
 * @returns {Issue}
 * @throws {Error} If issueId is invalid, issue is not found, or status is not in-progress
 */
export function submitForReview(issueId) {
  if (!Number.isInteger(issueId)) {
    throw new Error('issueId must be an integer');
  }

  const db = getDB();
  const existing = findById(db, issueId);

  if (existing.status !== Status.IN_PROGRESS) {
    throw new Error(
      `Issue #${issueId} is currently "${existing.status}". Only issues in "${Status.IN_PROGRESS}" can be submitted for review.`,
    );
  }

  db.update(issuesTable)
    .set({ status: Status.IN_REVIEW })
    .where(eq(issuesTable.id, issueId))
    .run();
  logActivity(
    db,
    issueId,
    Action.STATE_CHANGE,
    `Issue #${issueId} was submitted for review.`,
  );
  return getIssue(issueId);
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
  db.update(issuesTable).set({ status }).where(eq(issuesTable.id, id)).run();
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
  db.update(issuesTable).set({ priority }).where(eq(issuesTable.id, id)).run();
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
  db.update(issuesTable)
    .set({ attemptNum: sql`${issuesTable.attemptNum} + 1` })
    .where(eq(issuesTable.id, id))
    .run();
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
  db.delete(issuesTable).where(eq(issuesTable.id, id)).run();
  return true;
}

/**
 * Get the full activity history for a specific issue.
 * @param {number} issueId
 * @returns {ActivityLog[]}
 */
export function getActivityLog(issueId) {
  const db = getDB();
  return db.select().from(activityTable).where(eq(activityTable.issueId, issueId)).all();
}

/**
 * Get the most recent activity across all issues.
 * @param {RecentActivityOptions} options - Options for retrieving recent activity.
 * @returns {ActivityLog[]}
 */
export function getRecentActivity({ limit = 20 } = {}) {
  const db = getDB();
  return db.select().from(activityTable).orderBy(sql`${activityTable.logId} DESC`).limit(limit).all();
}
// =============================================================================
// Tracker operations (CLI: init / next / status / claim)
// To be edited later if needed.
// =============================================================================

/**
 * True when both `issues`, `activity`, and `agents` tables exist.
 * @returns {boolean}
 */
export function isTrackerReady() {
  const db = getDB();
  try {
    // use raw SQL query here, can't use Drizzle
    const row = db.get(sql`
        SELECT COUNT(*) AS table_count
        FROM sqlite_master
        WHERE type = 'table' AND name IN ('issues', 'activity', 'agents')
      `);
    return (row?.table_count ?? 0) === 3;
  } catch (error) {
    return false;
  }
}

/**
 * Issue counts by status for `baton status` (single round-trip).
 * @returns {{ total: number, open: number, inProgress: number, closed: number }}
 */
export function getIssueStats() {
  const db = getDB();
  const row = db.get(sql`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END), 0) AS open_count,
      COALESCE(SUM(CASE WHEN status = 'In-Progress' THEN 1 ELSE 0 END), 0) AS in_progress_count,
      COALESCE(SUM(CASE WHEN status = 'In-Review' THEN 1 ELSE 0 END), 0) AS in_review_count,
      COALESCE(SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END), 0) AS closed_count
    FROM issues
  `);
  
  return {
    total: Number(row?.total ?? 0),
    open: Number(row?.open_count ?? 0),
    inProgress: Number(row?.in_progress_count ?? 0),
    inReview: Number(row?.in_review_count ?? 0),
    closed: Number(row?.closed_count ?? 0),
  };
}

/**
 * All issues ordered by id.
 * @returns {object[]}
 */
export function getAllIssues() {
  const db = getDB();
  return db.select().from(issuesTable).orderBy(issuesTable.id).all();
}

/**
 * Highest-priority open issue, then lowest id (same ordering as previous JS sort).
 * @returns {object|null}
 */
export function selectNextIssue() {
  const db = getDB();
  return db.select()
    .from(issuesTable)
    .where(eq(issuesTable.status, Status.OPEN))
    .orderBy(
      sql`CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 ELSE 3 END`,
      issuesTable.id
    )
    .limit(1)
    .get() ?? null;
}

/**
 * Mark an issue in-progress, assign it to the current actor, increment attempts, and log activity.
 * @param {number} issueId
 * @returns {object}
 */
export function claimIssue(issueId) {
  const db = getDB();
  const issue = findById(db, issueId);

  if (issue.status === Status.CLOSED) {
    throw new Error(`Issue #${issueId} is closed and cannot be worked on.`);
  }

  db.transaction((tx) => {
    logActivity(tx, issueId, Action.READ, `Agent accessed issue #${issueId}`);
    
    tx.update(issuesTable)
      .set({
        status: Status.IN_PROGRESS,
        assigneeId: getCurrentActorId(),
        attemptNum: sql`${issuesTable.attemptNum} + 1`
      })
      .where(eq(issuesTable.id, issueId))
      .run();

    logActivity(
      tx,
      issueId,
      Action.STATE_CHANGE,
      `Status changed from ${issue.status} to ${Status.IN_PROGRESS}`
    );
    
    logActivity(
      tx,
      issueId,
      Action.EDIT,
      `Agent attempt #${issue.attemptNum + 1} on issue #${issueId}`
    );
  });

  return findById(db, issueId);
}

/**
 * Release an issue back to Open status, clearing the assignee.
 * Logs a STATE_CHANGE activity entry.
 * @param {number} issueId
 * @returns {Issue}
 * @throws {Error} If issueId is invalid or issue is not found
 */
export function unclaimIssue(issueId) {
  if (!Number.isInteger(issueId)) {
    throw new Error('issueId must be an integer');
  }

  const db = getDB();
  findById(db, issueId);

  db.update(issuesTable)
    .set({ status: Status.OPEN, assigneeId: null })
    .where(eq(issuesTable.id, issueId))
    .run();

  logActivity(
    db,
    issueId,
    Action.STATE_CHANGE,
    `Issue #${issueId} was released and returned to Open.`,
  );

  return getIssue(issueId);
}

/**
 * Remove all issues (`baton init --force`). Activity rows are kept for audit.
 */
export function clearAllIssues() {
  const db = getDB();
  db.delete(issuesTable).run();
}
