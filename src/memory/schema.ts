import type { DatabaseSync } from 'node:sqlite'

export const CURRENT_SCHEMA_VERSION = 1
type Migration = (db: DatabaseSync) => void
const MIGRATIONS: Record<number, Migration> = {}

export function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      event_seq INTEGER,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      event_type TEXT NOT NULL,
      content_json TEXT,
      source_json TEXT NOT NULL,
      call_id TEXT,
      related_event_ids_json TEXT NOT NULL,
      capture_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data_version INTEGER NOT NULL DEFAULT 1,
      candidate_type TEXT,
      emotions_json TEXT,
      meaning TEXT,
      importance REAL,
      confidence REAL,
      memory_type TEXT,
      related_memories_json TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_memory_events_session ON memory_events(session_id, event_seq);
    CREATE INDEX IF NOT EXISTS idx_memory_events_timestamp ON memory_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_memory_events_call ON memory_events(session_id, call_id);
  `)
  const row = db.prepare('SELECT version FROM schema_version ORDER BY version DESC LIMIT 1').get()
  if (!row) {
    db.prepare('INSERT INTO schema_version(version, applied_at) VALUES (?, ?)').run(CURRENT_SCHEMA_VERSION, new Date().toISOString())
  } else {
    const version = Number(row.version)
    if (version > CURRENT_SCHEMA_VERSION) throw new Error('Unsupported memory schema version: ' + String(version))
    for (let next = version + 1; next <= CURRENT_SCHEMA_VERSION; next += 1) {
      MIGRATIONS[next]?.(db)
      db.prepare('INSERT INTO schema_version(version, applied_at) VALUES (?, ?)').run(next, new Date().toISOString())
    }
  }
}
