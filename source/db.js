/** AI was consulted to help draft the initial better-sqlite3 setup and explain how to create/open the SQLite database filem. 
*The final schema choices, file structure, and code review changes were made by the team.
*/
/* global process */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

/**
 * Describes path to the folder 'data', where the SQLite database will be stored.
 */
const dataDir = path.join(process.cwd(), "data");

/**
 * Describes path to actual SQLite database file.
 */
const dbPath = path.join(dataDir, "issues.db");

/**
 * Makes the data folder if doesn't currently exist.
 */
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

/**
 * Opens the SQLite database file and crestes it if file doesn't exist.
 */
const db = new Database(dbPath);

/**
 * Database initialization by creating issues and activity tables.
 */
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      attempt_num INTEGER DEFAULT 0 NOT NULL,
      title TEXT DEFAULT 'PENDING' NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open'
        CHECK (status IN ('Open', 'In-Progress', 'Closed')),
      priority TEXT DEFAULT 'Low'
        CHECK (priority IN ('Low', 'Medium', 'High')),
      token_limit INTEGER CHECK (token_limit >= 0),
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS activity (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      action TEXT NOT NULL
        CHECK (action IN (
          'state_change',
          'priority_change',
          'edit',
          'read',
          'creation',
          'deletion'
        )),
      details TEXT
    );

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
}

/**
 * Returns the database instance for other files to run queries.
 */
export function getDB() {
  return db;
}