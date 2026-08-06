import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { getServerConfig } from "@/infrastructure/config/env";
import { runMigrations } from "@/infrastructure/db/sqlite/migrate";

let dbInstance: Database.Database | null = null;

/**
 * Returns the process-wide `better-sqlite3` connection singleton, creating the
 * containing directory and running pending migrations on first acquisition
 * (FR-13). Safe to call repeatedly — subsequent calls return the same instance
 * without re-running migrations (idempotent runner, but also skipped here via
 * the module-level cache).
 */
export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const { sqliteFilePath } = getServerConfig();
  const dbDir = path.dirname(sqliteFilePath);
  fs.mkdirSync(dbDir, { recursive: true });

  const db = new Database(sqliteFilePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);

  dbInstance = db;
  return dbInstance;
}

/** Test-only helper to reset the singleton between test cases. */
export function __resetDbForTests(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
