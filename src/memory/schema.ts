import type { DatabaseSync } from 'node:sqlite'

export const CURRENT_SCHEMA_VERSION = 3
type Migration = (db: DatabaseSync) => void
const MIGRATIONS: Record<number, Migration> = {
  2: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory_orbs (
        id TEXT PRIMARY KEY,
        dedupe_key TEXT NOT NULL UNIQUE,
        source_event_ids_json TEXT NOT NULL,
        session_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        emotions_json TEXT NOT NULL,
        emotion_confidence REAL NOT NULL,
        meaning TEXT,
        meaning_confidence REAL NOT NULL,
        importance REAL NOT NULL,
        importance_reasons_json TEXT NOT NULL,
        core_memory_candidate INTEGER NOT NULL,
        tags_json TEXT NOT NULL,
        related_memory_ids_json TEXT NOT NULL,
        evidence_event_ids_json TEXT NOT NULL,
        analysis_method TEXT NOT NULL,
        analysis_version TEXT NOT NULL,
        review_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memory_orbs_session ON memory_orbs(session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_memory_orbs_importance ON memory_orbs(importance DESC);
      CREATE INDEX IF NOT EXISTS idx_memory_orbs_actor ON memory_orbs(actor);
    `)
  },
  3: (db) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory_reflections (
        id TEXT PRIMARY KEY,
        dedupe_key TEXT NOT NULL UNIQUE,
        reflection_type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        lesson TEXT,
        source_event_ids_json TEXT NOT NULL,
        source_orb_ids_json TEXT NOT NULL,
        session_ids_json TEXT NOT NULL,
        evidence_status TEXT NOT NULL,
        confidence REAL NOT NULL,
        verification_status TEXT NOT NULL,
        analysis_method TEXT NOT NULL,
        analysis_version TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS reflection_sources (
        reflection_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        PRIMARY KEY (reflection_id, event_id)
      );
      CREATE INDEX IF NOT EXISTS idx_reflections_session ON memory_reflections(session_ids_json);
      CREATE INDEX IF NOT EXISTS idx_reflections_type ON memory_reflections(reflection_type);
      CREATE INDEX IF NOT EXISTS idx_reflections_status ON memory_reflections(verification_status);
    `)
  },
}

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
  const version = row ? Number(row.version) : 1
  if (version > CURRENT_SCHEMA_VERSION) throw new Error('Unsupported memory schema version: ' + String(version))
  if (!row) db.prepare('INSERT INTO schema_version(version, applied_at) VALUES (?, ?)').run(1, new Date().toISOString())
  for (let next = version + 1; next <= CURRENT_SCHEMA_VERSION; next += 1) {
    MIGRATIONS[next]?.(db)
    db.prepare('INSERT INTO schema_version(version, applied_at) VALUES (?, ?)').run(next, new Date().toISOString())
  }
}
