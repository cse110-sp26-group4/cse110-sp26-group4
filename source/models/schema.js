import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { Status, Priority } from "./issue.js";
import { Action } from "./activityLog.js";

export const issuesTable = sqliteTable("issues", {
  id:          int().primaryKey({ autoIncrement: true }),
  createdAt:   text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  attemptNum:  int("attempt_num").notNull().default(0),
  title:       text().notNull().default("PENDING"),
  status:      text({ enum: Object.values(Status) }).notNull().default(Status.OPEN),
  priority:    text({ enum: Object.values(Priority) }).default(Priority.LOW),
  tokenLimit:  int("token_limit"),
  description: text(),
});

export const activityTable = sqliteTable("activity", {
  logId:     int("log_id").primaryKey({ autoIncrement: true }),
  issueId:   int("issue_id"), 
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  action:    text({ enum: Object.values(Action) }).notNull(),
  details:   text(),
});

// helper for parsing command line arguments 
export const issueSchema = {
    id:         { flag: '--id', type: 'number' },
    attemptNum: { flag: '--attempt', type: 'number' },
    title:      { flag: '--title', type: 'string' },
    status:     { flag: '--status', type: 'enum', values: Object.values(Status) },
    tokenLimit: { flag: '--token-limit', type: 'number' },
    priority:   { flag: '--priority', type: 'enum', values: Object.values(Priority) },
    description:{ flag: '--description', type: 'string' },
    // Pagination options 
    limit:      { flag: '--limit', type: 'number' },
    offset:       { flag: '--offset', type: 'number' }
};