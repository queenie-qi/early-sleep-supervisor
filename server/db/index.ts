import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use env DB_PATH for cloud deployment (Render persistent disk), fallback to local
const dbPath = process.env.DB_PATH || join(__dirname, '../../data.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Idempotent migration: add target_time to groups if missing
try {
  db.exec("ALTER TABLE groups ADD COLUMN target_time TEXT DEFAULT '00:30'");
} catch {
  // Column already exists
}

export default db;
