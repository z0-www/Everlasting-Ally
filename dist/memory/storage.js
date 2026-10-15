import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname } from 'node:path';
import { initializeSchema } from './schema.js';
const SENSITIVE_KEY = /password|passphrase|token|secret|api[_-]?key|authorization|cookie|credential/i;
const SENSITIVE_VALUE = /bearer\s+[a-z0-9._~+/=-]{8,}|(?:sk|ghp|github_pat|xox[baprs])-[a-z0-9_-]{8,}|\b(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+/i;
const REDACTED = '[REDACTED]';
export const PLUGIN_VERSION = '0.3.0';
function sanitize(value, key = '') {
    if (SENSITIVE_KEY.test(key))
        return REDACTED;
    if (typeof value === 'string')
        return SENSITIVE_VALUE.test(value) ? REDACTED : value;
    if (Array.isArray(value))
        return value.map((item) => sanitize(item));
    if (value !== null && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, sanitize(item, name)]));
    return value;
}
function json(value) {
    try {
        return value === null || value === undefined ? null : JSON.stringify(value);
    }
    catch {
        return null;
    }
}
function parseJson(value) {
    if (typeof value !== 'string')
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
function numberOrNull(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function rowToEvent(row) {
    const candidateType = typeof row.candidate_type === 'string' ? row.candidate_type : undefined;
    return {
        id: String(row.id), sessionId: String(row.session_id), eventSeq: numberOrNull(row.event_seq),
        timestamp: String(row.timestamp), actor: row.actor,
        eventType: row.event_type, content: parseJson(row.content_json),
        source: parseJson(row.source_json),
        callId: typeof row.call_id === 'string' ? row.call_id : null,
        relatedEventIds: parseJson(row.related_event_ids_json) ?? [],
        captureStatus: row.capture_status, createdAt: String(row.created_at),
        ...(candidateType ? { candidateType } : {}),
        emotions: parseJson(row.emotions_json) ?? null,
        meaning: typeof row.meaning === 'string' ? row.meaning : null,
        importance: numberOrNull(row.importance), confidence: numberOrNull(row.confidence),
        memoryType: typeof row.memory_type === 'string' ? row.memory_type : null,
        relatedMemories: parseJson(row.related_memories_json) ?? null,
    };
}
export class MemoryStorage {
    config;
    db = null;
    lastError = null;
    lastSuccessfulWriteAt = null;
    constructor(config) {
        this.config = config;
        if (!config.enabled)
            return;
        mkdirSync(dirname(config.databasePath), { recursive: true });
        const db = new DatabaseSync(config.databasePath);
        initializeSchema(db);
        this.db = db;
        if (config.retentionDays > 0) {
            const cutoff = new Date(Date.now() - config.retentionDays * 86400000).toISOString();
            db.prepare('DELETE FROM memory_events WHERE timestamp < ?').run(cutoff);
        }
    }
    get available() { return this.db !== null && this.lastError === null; }
    saveEvent(event) {
        if (!this.config.enabled)
            return { saved: false, reason: 'disabled' };
        if (!this.db)
            return { saved: false, reason: this.lastError ? 'unavailable' : 'closed' };
        if (event.actor === 'user' && !this.config.captureUserMessages)
            return { saved: false, reason: 'filtered' };
        if (event.actor === 'assistant' && !this.config.captureAssistantMessages)
            return { saved: false, reason: 'filtered' };
        if (event.actor === 'tool' && !this.config.captureToolEvents)
            return { saved: false, reason: 'filtered' };
        const content = event.content === null ? null : sanitize(event.content);
        const contentJson = json(content);
        const tooLarge = contentJson !== null && new TextEncoder().encode(contentJson).byteLength > this.config.maxEventBytes;
        const storedStatus = tooLarge ? 'partial' : event.captureStatus;
        const storedContent = tooLarge ? null : contentJson;
        if (storedContent === null && event.content !== null && contentJson === null)
            return { saved: false, reason: 'filtered' };
        try {
            const result = this.db.prepare(`
        INSERT OR IGNORE INTO memory_events (
          id, session_id, event_seq, timestamp, actor, event_type, content_json,
          source_json, call_id, related_event_ids_json, capture_status, created_at,
          data_version, candidate_type, emotions_json, meaning, importance, confidence,
          memory_type, related_memories_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event.id, event.sessionId, event.eventSeq, event.timestamp, event.actor, event.eventType, storedContent, json(event.source), event.callId, json(event.relatedEventIds) ?? '[]', storedStatus, event.createdAt, 1, event.candidateType ?? null, json(event.emotions), event.meaning, event.importance, event.confidence, event.memoryType, json(event.relatedMemories));
            if (Number(result.changes) === 0)
                return { saved: false, reason: 'duplicate' };
            this.lastSuccessfulWriteAt = new Date().toISOString();
            return { saved: true };
        }
        catch (error) {
            this.lastError = error instanceof Error ? error.name : 'database error';
            return { saved: false, reason: 'unavailable' };
        }
    }
    getEvent(id) {
        const row = this.db?.prepare('SELECT * FROM memory_events WHERE id = ?').get(id);
        return row ? rowToEvent(row) : null;
    }
    listSessionEvents(sessionId) {
        const rows = this.db?.prepare('SELECT * FROM memory_events WHERE session_id = ? ORDER BY event_seq IS NULL, event_seq, timestamp').all(sessionId) ?? [];
        return rows.map(rowToEvent);
    }
    listRecentEvents(limit = 100) {
        const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
        const rows = this.db?.prepare('SELECT * FROM memory_events ORDER BY timestamp DESC, rowid DESC LIMIT ?').all(safeLimit) ?? [];
        return rows.map(rowToEvent);
    }
    deleteSession(sessionId) {
        if (!this.db)
            return false;
        try {
            return Number(this.db.prepare('DELETE FROM memory_events WHERE session_id = ?').run(sessionId).changes) > 0;
        }
        catch {
            return false;
        }
    }
    clearAllMemories() {
        if (!this.db)
            return false;
        try {
            this.db.prepare('DELETE FROM memory_events').run();
            return true;
        }
        catch {
            return false;
        }
    }
    getMemoryStats() {
        if (!this.config.enabled)
            return { pluginVersion: PLUGIN_VERSION, enabled: false, databaseStatus: 'disabled', eventCount: 0, sessionCount: 0, lastSuccessfulWriteAt: this.lastSuccessfulWriteAt };
        if (!this.db)
            return { pluginVersion: PLUGIN_VERSION, enabled: true, databaseStatus: this.lastError ? 'unavailable' : 'closed', eventCount: 0, sessionCount: 0, lastSuccessfulWriteAt: this.lastSuccessfulWriteAt };
        try {
            const count = this.db.prepare('SELECT COUNT(*) AS count FROM memory_events').get();
            const sessions = this.db.prepare('SELECT COUNT(DISTINCT session_id) AS count FROM memory_events').get();
            return { pluginVersion: PLUGIN_VERSION, enabled: true, databaseStatus: 'ready', eventCount: Number(count?.count ?? 0), sessionCount: Number(sessions?.count ?? 0), lastSuccessfulWriteAt: this.lastSuccessfulWriteAt };
        }
        catch {
            return { pluginVersion: PLUGIN_VERSION, enabled: true, databaseStatus: 'unavailable', eventCount: 0, sessionCount: 0, lastSuccessfulWriteAt: this.lastSuccessfulWriteAt };
        }
    }
    close() {
        if (!this.db)
            return;
        try {
            this.db.close();
        }
        finally {
            this.db = null;
        }
    }
}
