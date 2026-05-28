import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import path from "path";

import * as schema from "../models/schema.js"; 

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "issues.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize better-sqlite3 connection
const sqliteConnection = new Database(dbPath);

// Initialize Drizzle ORM, passing in the schema for relational queries
const db = drizzle(sqliteConnection, { schema });

export function initDB() {
  // Apply Migrations dynamically on CLI startup
  // This looks for a folder named "drizzle" in your project root
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  
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
}

export function getDB() {
  return db;
}