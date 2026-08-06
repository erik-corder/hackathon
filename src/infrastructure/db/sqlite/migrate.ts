import fs from "node:fs";
import path from "node:path";

import type Database from "better-sqlite3";

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "infrastructure", "db", "migrations");
const MIGRATION_FILE_PATTERN = /^(\d+)_.*\.sql$/;

interface MigrationFile {
  version: number;
  fileName: string;
  fullPath: string;
}

function listMigrationFiles(migrationsDir: string): MigrationFile[] {
  return fs
    .readdirSync(migrationsDir)
    .filter((fileName) => MIGRATION_FILE_PATTERN.test(fileName))
    .map((fileName) => {
      const match = MIGRATION_FILE_PATTERN.exec(fileName);
      const version = Number.parseInt(match![1], 10);
      return { version, fileName, fullPath: path.join(migrationsDir, fileName) };
    })
    .sort((a, b) => a.version - b.version);
}

/**
 * Hand-rolled, versioned SQL migration runner (FR-13/AC-16 — no ORM, see
 * `02-plan.md` §4 rejected alternatives). Tracks applied versions in a
 * `schema_migrations` bookkeeping table (intentionally not part of the domain
 * ERD, see `06-erd.mmd`'s header note), and applies each pending `.sql` file
 * inside its own transaction. Idempotent: re-running against an already
 * up-to-date database applies nothing.
 */
export function runMigrations(db: Database.Database, migrationsDir: string = MIGRATIONS_DIR): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedVersions = new Set(
    db.prepare("SELECT version FROM schema_migrations").all().map((row) => (row as { version: number }).version),
  );

  const pending = listMigrationFiles(migrationsDir).filter((file) => !appliedVersions.has(file.version));

  for (const migration of pending) {
    const sql = fs.readFileSync(migration.fullPath, "utf8");
    const applyMigration = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(
        migration.version,
        new Date().toISOString(),
      );
    });
    applyMigration();
  }
}
