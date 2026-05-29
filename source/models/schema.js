import { check, int, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
  assignees:   text({mode: "json"}).default(sql`'[]'`),
});

export const activityTable = sqliteTable(
  "activity",
  {
    logId:     int("log_id").primaryKey({ autoIncrement: true }),
    issueId:   int("issue_id"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    action:    text({ enum: Object.values(Action) }).notNull(),
    details:   text(),
  },
  (table) => [
    check(
      "activity_action_check",
      sql`${table.action} IN (${sql.raw(
        Object.values(Action)
          .map((value) => `'${value}'`)
          .join(", "),
      )})`,
    ),
  ],
);
