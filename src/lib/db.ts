import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
let db: Database.Database | null = null;
export function dbPath(): string {
    return process.env.CV_TAILOR_DATA_DIR
        ? join(process.env.CV_TAILOR_DATA_DIR, "cv-tailor.db")
        : join(process.cwd(), "data", "cv-tailor.db");
}
export function getDb(): Database.Database {
    if (db)
        return db;
    const path = dbPath();
    mkdirSync(dirname(path), { recursive: true });
    db = new Database(path);
    initDb(db);
    return db;
}
export function openTestDb(path: string): Database.Database {
    mkdirSync(dirname(path), { recursive: true });
    const testDb = new Database(path);
    initDb(testDb);
    return testDb;
}
function initDb(handle: Database.Database): void {
    handle.pragma("journal_mode = WAL");
    handle.pragma("foreign_keys = ON");
    migrate(handle);
}
function migrate(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      raw_description TEXT NOT NULL,
      requirements_json TEXT NOT NULL,
      analyzer TEXT NOT NULL DEFAULT 'deterministic',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id);

    CREATE TABLE IF NOT EXISTS cv_variants (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      template_id TEXT NOT NULL,
      config_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_cv_user ON cv_variants(user_id);
    CREATE INDEX IF NOT EXISTS idx_cv_job ON cv_variants(job_id);

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
  `);
    const hasAnalyzer = db
        .prepare("SELECT COUNT(*) AS n FROM pragma_table_info('jobs') WHERE name = 'analyzer'")
        .get() as {
        n: number;
    };
    if (hasAnalyzer.n === 0) {
        db.exec("ALTER TABLE jobs ADD COLUMN analyzer TEXT NOT NULL DEFAULT 'deterministic'");
    }
}
