import { getDB } from '../db/index.js';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { issuesTable, activityTable } from '../models/schema.js';
import { Issue, Status, Priority } from '../models/issue.js';
import { ActivityLog, Action } from '../models/activityLog.js';

function logActivity(db, issueId, action, details = null) {
  db.insert(activityTable).values({ issueId, action, details }).run();
}

function rowToIssue(row) {
  return row ? new Issue(row) : null;
}

function rowToLog(row) {
  return row ? new ActivityLog(row) : null;
}

function findById(db, id) {
  const row = db.select().from(issuesTable).where(eq(issuesTable.id, id)).get();
  if (!row) throw new Error(`Issue #${id} not found`);
  return row;
}

export function createIssue({ title, priority, tokenLimit, description } = {}) {
  const db = getDB();
  const result = db
    .insert(issuesTable)
    .values({
      title: title?.trim() || 'PENDING',
      priority: priority ?? Priority.LOW,
      tokenLimit: tokenLimit ?? null,
      description: description ?? null,
    })
    .returning({ id: issuesTable.id })
    .get();

  const issue = rowToIssue(findById(db, result.id));
  logActivity(db, issue.id, Action.CREATION, `"${issue.title}" was created.`);
  return issue;
}

export function getIssue(id) {
  const db = getDB();
  const issue = rowToIssue(findById(db, id));
  logActivity(db, id, Action.READ, `Issue #${id} was accessed.`);
  return issue;
}

export async function listIssues({ status, priority, limit, offset } = {}) {
  const db = getDB();
  const filters = [];
  if (status) filters.push(sql`${issuesTable.status} COLLATE NOCASE = ${status}`);
  if (priority) filters.push(sql`${issuesTable.priority} COLLATE NOCASE = ${priority}`);
  const limitVal = limit ?? 50;
  const offsetVal = offset ?? 0;
  return db.select().from(issuesTable).where(filters.length > 0 ? and(...filters) : undefined).limit(limitVal).offset(offsetVal).all();
}

export function searchIssues(query) {
  const db = getDB();
  if (!query || query.trim() == '') return [];
  const searchTerm = `%${query.toLowerCase().trim()}%`;
  return db.select().from(issuesTable).where(or(like(issuesTable.title, searchTerm), like(issuesTable.description, searchTerm))).all();
}

export function updateIssue(id, oldIssue, { title, description, tokenLimit, status, priority } = {}) {
  const db = getDB();
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (tokenLimit !== undefined) updates.tokenLimit = tokenLimit;
  if (status !== undefined) {
    const statusValues = Object.values(Status);
    const toUpdate = statusValues.find((v) => v.trim().toLowerCase() === status.trim().toLowerCase());
    updates.status = toUpdate || status;
  }
  if (priority !== undefined) {
    const priorityValues = Object.values(Priority);
    const toUpdate = priorityValues.find((v) => v.toLowerCase().trim() === priority.trim().toLowerCase());
    updates.priority = toUpdate || priority;
  }
  const proposedIssue = new Issue({ ...oldIssue, ...updates });
  const { isValid, errors } = proposedIssue.validate();
  if (!isValid) throw new Error(`Validation failed: ${errors.join(', ')}`);
  if (Object.keys(updates).length > 0) db.update(issuesTable).set(updates).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.EDIT, `Issue #${id} was updated.`);
  return getIssue(id);
}

export function assignIssue(id, userId) {
  const db = getDB();
  const assignTx = db.transaction(() => {
    const existing = findById(db, id);
    const current = existing.assignees ?? [];
    const newAssignees = Array.isArray(current) ? [...current, userId] : [userId];
    db.update(issuesTable).set({ assignees: newAssignees }).where(eq(issuesTable.id, id)).run();
    logActivity(db, id, Action.EDIT, `Issue #${id} assigned to ${userId}.`);
  });
  assignTx();
  return getIssue(id);
}

export function respondToIssue(id, userId, message) {
  const db = getDB();
  const issue = rowToIssue(findById(db, id));
  if (issue.status !== Status.BLOCKED) throw new Error(`Cannot respond to Issue #${id} because it is not blocked; current status is ${issue.status}`);
  db.update(issuesTable).set({ status: Status.IN_PROGRESS }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.STATE_CHANGE, `Issue #${id} unblocked. Response logged and agent notified. ${userId} message: "${message}"`);
  return getIssue(id);
}

export function approveIssue(id) {
  const db = getDB();
  db.update(issuesTable).set({ status: Status.CLOSED }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.STATE_CHANGE, `Issue #${id} has been closed`);
  return getIssue(id);
}

export function rejectIssue(id, reason) {
  const db = getDB();
  db.update(issuesTable).set({ status: Status.IN_PROGRESS }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.REJECT, `Issue #${id} has been rejected due to "${reason}"`);
  return getIssue(id);
}

export function submitForReview(id) {
  const db = getDB();
  db.update(issuesTable).set({ status: Status.IN_REVIEW }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.STATE_CHANGE, `Issue #${id} was submitted for review.`);
  return getIssue(id);
}

export function setStatus(id, status) {
  const db = getDB();
  db.update(issuesTable).set({ status }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.STATE_CHANGE, `Issue #${id} status changed to ${status}.`);
  return getIssue(id);
}

export function setPriority(id, priority) {
  const db = getDB();
  db.update(issuesTable).set({ priority }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.PRIORITY_CHANGE, `Issue #${id} priority changed to ${priority}.`);
  return getIssue(id);
}

export function incrementAttempt(id) {
  const db = getDB();
  db.update(issuesTable).set({ attemptNum: sql`${issuesTable.attemptNum} + 1` }).where(eq(issuesTable.id, id)).run();
  logActivity(db, id, Action.EDIT, `Attempt count increased for Issue #${id}.`);
  return getIssue(id);
}

export function deleteIssue(id) {
  const db = getDB();
  const existing = findById(db, id);
  logActivity(db, id, Action.DELETION, `"${existing.title}" was deleted.`);
  db.delete(issuesTable).where(eq(issuesTable.id, id)).run();
  return true;
}

export function getActivityLog(issueId) {
  const db = getDB();
  return db.select().from(activityTable).where(eq(activityTable.issueId, issueId)).all();
}

export function getRecentActivity({ limit = 20 } = {}) {
  const db = getDB();
  return db.select().from(activityTable).orderBy(sql`${activityTable.logId} DESC`).limit(limit).all();
}

export function isTrackerReady() {
  const db = getDB();
  try {
    const row = db.get(sql`
        SELECT COUNT(*) AS table_count
        FROM sqlite_master
        WHERE type = 'table' AND name IN ('issues', 'activity')
      `);
    return (row?.table_count ?? 0) === 2;
  } catch (error) {
    return false;
  }
}

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

export function getAllIssues() {
  const db = getDB();
  return db.select().from(issuesTable).orderBy(issuesTable.id).all();
}

export function selectNextIssue() {
  const db = getDB();
  return db.select().from(issuesTable).where(eq(issuesTable.status, Status.OPEN)).orderBy(sql`CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 WHEN 'Low' THEN 2 ELSE 3 END`, issuesTable.id).limit(1).get() ?? null;
}

export function workOnIssue(issueId) {
  const db = getDB();
  const issue = findById(db, issueId);
  if (issue.status === Status.CLOSED) {
    throw new Error(`Issue #${issueId} is closed and cannot be worked on.`);
  }

  db.transaction((tx) => {
    logActivity(tx, issueId, Action.READ, `Agent accessed issue #${issueId}`);
    tx.update(issuesTable).set({ status: Status.IN_PROGRESS, attemptNum: sql`${issuesTable.attemptNum} + 1` }).where(eq(issuesTable.id, issueId)).run();
    logActivity(tx, issueId, Action.STATE_CHANGE, `Status changed from ${issue.status} to ${Status.IN_PROGRESS}`);
    logActivity(tx, issueId, Action.EDIT, `Agent attempt #${issue.attemptNum + 1} on issue #${issueId}`);
  });

  return findById(db, issueId);
}

export function clearAllIssues() {
  const db = getDB();
  db.delete(issuesTable).run();
}
