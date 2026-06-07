import Database from "better-sqlite3";
import { fileURLToPath } from 'url';
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";

import * as schema from "../models/schema.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(process.cwd(), ".baton");
const dbPath = path.join(dataDir, "baton.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize better-sqlite3 connection
// Using let here so we can reassign it in tests with an in-memory database instance.
let sqliteConnection = new Database(dbPath);

// Initialize Drizzle ORM, passing in the schema for relational queries
// Using let here so we can reassign it in tests with an in-memory database instance.
let db = drizzle(sqliteConnection, { schema });

/**
 * Applies Drizzle migrations and installs the two SQLite triggers required by the schema.
 * Must be called once at CLI startup before any DB operations.
 */
export function initDB() {
  // Apply Migrations dynamically on CLI startup
  // This looks for a folder named "drizzle" in your project root
  const migrationsFolder = path.join(__dirname, '../../drizzle');
  
  if (fs.existsSync(migrationsFolder)) {
    migrate(db, { migrationsFolder });
  } else {
    console.warn("No migrations folder found. Tables may not be created.");
  }

  // Execute custom SQLite logic (Triggers)
  // Drizzle does not manage triggers in its schema file, so we keep this raw.
  sqliteConnection.exec(`
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

  sqliteConnection.exec(`
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
}

/**
 * Returns the active Drizzle ORM database instance.
 * @returns {object} Drizzle database instance.
 */
export function getDB() {
  return db;
}

/**
 * Returns the underlying better-sqlite3 connection.
 * Needed for raw SQL operations (e.g. trigger setup in tests).
 * @returns {object} Raw better-sqlite3 Database instance.
 */
export function getSQLiteDB() {
  return sqliteConnection;
}

/**
 * Replaces the active DB instances with in-memory test doubles.
 * Call this before importing service modules in test files.
 * @param {object} testDbInstance - Drizzle database wrapping an in-memory SQLite instance.
 * @param {object} [testSqliteConnection] - Raw better-sqlite3 in-memory instance.
 */
export function setTestDB(testDbInstance, testSqliteConnection) {
  db = testDbInstance;
  if (testSqliteConnection) sqliteConnection = testSqliteConnection;
}