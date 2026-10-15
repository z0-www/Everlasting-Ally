import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { dirname } from 'node:path'
import type { MemoryConfig } from './config.js'
import { initializeSchema } from './schema.js'
import type { JsonValue, MemoryEvent } from './types.js'
import type { MemoryOrb } from './orb/types.js'
import type { ReflectionRecord } from './reflection/types.js'

export type MemoryStats = {
  pluginVersion: string
  enabled: boolean
  databaseStatus: 'ready' | 'disabled' | 'unavailable' | 'closed'
  eventCount: number
  sessionCount: number
  lastSuccessfulWriteAt: string | null
}
export type SaveEventResult = {
  saved: boolean
  reason?: 'disabled' | 'filtered' | 'too_large' | 'unavailable' | 'closed' | 'duplicate'
}
export type SaveOrbResult = { saved: boolean; reason?: 'disabled' | 'analysis_disabled' | 'unavailable' | 'closed' | 'duplicate' }
export type SaveReflectionResult = { saved: boolean; reason?: 'disabled' | 'reflection_disabled' | 'unavailable' | 'closed' | 'duplicate' }

const SENSITIVE_KEY = /password|passphrase|token|secret|api[_-]?key|authorization|cookie|credential/i
const SENSITIVE_VALUE = /bearer\s+[a-z0-9._~+/=-]{8,}|(?:sk|ghp|github_pat|xox[baprs])-[a-z0-9_-]{8,}|\b(?:password|token|secret|api[_-]?key)\s*[:=]\s*\S+/i
const REDACTED = '[REDACTED]'
export const PLUGIN_VERSION = '0.6.0'

function sanitize(value: JsonValue, key = ''): JsonValue {
  if (SENSITIVE_KEY.test(key)) return REDACTED
  if (typeof value === 'string') return SENSITIVE_VALUE.test(value) ? REDACTED : value
  if (Array.isArray(value)) return value.map((item) => sanitize(item))
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, sanitize(item, name)]))
  return value
}
function json(value: unknown): string | null {
  try { return value === null || value === undefined ? null : JSON.stringify(value) } catch { return null }
}
function parseJson(value: unknown): JsonValue | null {
  if (typeof value !== 'string') return null
  try { return JSON.parse(value) as JsonValue } catch { return null }
}
function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}
function rowToEvent(row: Record<string, unknown>): MemoryEvent {
  const candidateType = typeof row.candidate_type === 'string' ? row.candidate_type as MemoryEvent['candidateType'] : undefined
  return {
    id: String(row.id), sessionId: String(row.session_id), eventSeq: numberOrNull(row.event_seq),
    timestamp: String(row.timestamp), actor: row.actor as MemoryEvent['actor'],
    eventType: row.event_type as MemoryEvent['eventType'], content: parseJson(row.content_json),
    source: parseJson(row.source_json) as MemoryEvent['source'],
    callId: typeof row.call_id === 'string' ? row.call_id : null,
    relatedEventIds: (parseJson(row.related_event_ids_json) as string[] | null) ?? [],
    captureStatus: row.capture_status as MemoryEvent['captureStatus'], createdAt: String(row.created_at),
    ...(candidateType ? { candidateType } : {}),
    emotions: (parseJson(row.emotions_json) as string[] | null) ?? null,
    meaning: typeof row.meaning === 'string' ? row.meaning : null,
    importance: numberOrNull(row.importance), confidence: numberOrNull(row.confidence),
    memoryType: typeof row.memory_type === 'string' ? row.memory_type : null,
    relatedMemories: (parseJson(row.related_memories_json) as string[] | null) ?? null,
  }
}
function rowToOrb(row: Record<string, unknown>): MemoryOrb {
  const array = (value: unknown): string[] => (parseJson(value) as string[] | null) ?? []
  return {
    id: String(row.id), sourceEventIds: array(row.source_event_ids_json),
    sessionId: String(row.session_id), actor: row.actor as MemoryOrb['actor'],
    timestamp: String(row.timestamp), emotions: array(row.emotions_json) as MemoryOrb['emotions'],
    emotionConfidence: Number(row.emotion_confidence), meaning: typeof row.meaning === 'string' ? row.meaning : null,
    meaningConfidence: Number(row.meaning_confidence), importance: Number(row.importance),
    importanceReasons: array(row.importance_reasons_json), coreMemoryCandidate: Boolean(row.core_memory_candidate),
    tags: array(row.tags_json), relatedMemoryIds: array(row.related_memory_ids_json),
    evidenceEventIds: array(row.evidence_event_ids_json),
    analysisMethod: row.analysis_method as MemoryOrb['analysisMethod'], analysisVersion: String(row.analysis_version),
    reviewStatus: row.review_status as MemoryOrb['reviewStatus'], createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}
function rowToReflection(row: Record<string, unknown>): ReflectionRecord {
  const array = (value: unknown): string[] => (parseJson(value) as string[] | null) ?? []
  return {
    id: String(row.id), reflectionType: row.reflection_type as ReflectionRecord['reflectionType'],
    title: String(row.title), summary: String(row.summary), lesson: typeof row.lesson === 'string' ? row.lesson : null,
    sourceEventIds: array(row.source_event_ids_json), sourceOrbIds: array(row.source_orb_ids_json),
    sessionIds: array(row.session_ids_json), evidenceStatus: row.evidence_status as ReflectionRecord['evidenceStatus'],
    confidence: Number(row.confidence), verificationStatus: row.verification_status as ReflectionRecord['verificationStatus'],
    analysisMethod: row.analysis_method as ReflectionRecord['analysisMethod'],
    analysisVersion: String(row.analysis_version), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  }
}

export class MemoryStorage {
  private db: DatabaseSync | null = null
  private lastError: string | null = null
  private lastSuccessfulWriteAt: string | null = null

  constructor(public readonly config: MemoryConfig) {
    if (!config.enabled) return
    mkdirSync(dirname(config.databasePath), { recursive: true })
    const db = new DatabaseSync(config.databasePath)
    initializeSchema(db)
    this.db = db
    if (config.retentionDays > 0) {
      const cutoff = new Date(Date.now() - config.retentionDays * 86400000).toISOString()
      db.prepare('DELETE FROM memory_orbs WHERE timestamp < ?').run(cutoff)
      db.prepare('DELETE FROM memory_events WHERE timestamp < ?').run(cutoff)
    }
  }
  get available(): boolean { return this.db !== null && this.lastError === null }
  saveEvent(event: MemoryEvent): SaveEventResult {
    if (!this.config.enabled) return { saved: false, reason: 'disabled' }
    if (!this.db) return { saved: false, reason: this.lastError ? 'unavailable' : 'closed' }
    if (event.actor === 'user' && !this.config.captureUserMessages) return { saved: false, reason: 'filtered' }
    if (event.actor === 'assistant' && !this.config.captureAssistantMessages) return { saved: false, reason: 'filtered' }
    if (event.actor === 'tool' && !this.config.captureToolEvents) return { saved: false, reason: 'filtered' }
    const content = event.content === null ? null : sanitize(event.content)
    const contentJson = json(content)
    const tooLarge = contentJson !== null && new TextEncoder().encode(contentJson).byteLength > this.config.maxEventBytes
    const storedStatus = tooLarge ? 'partial' : event.captureStatus
    const storedContent = tooLarge ? null : contentJson
    if (storedContent === null && event.content !== null && contentJson === null) return { saved: false, reason: 'filtered' }
    try {
      const result = this.db.prepare(`
        INSERT OR IGNORE INTO memory_events (
          id, session_id, event_seq, timestamp, actor, event_type, content_json,
          source_json, call_id, related_event_ids_json, capture_status, created_at,
          data_version, candidate_type, emotions_json, meaning, importance, confidence,
          memory_type, related_memories_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id, event.sessionId, event.eventSeq, event.timestamp, event.actor, event.eventType,
        storedContent, json(event.source), event.callId, json(event.relatedEventIds) ?? '[]',
        storedStatus, event.createdAt, 1, event.candidateType ?? null, json(event.emotions),
        event.meaning, event.importance, event.confidence, event.memoryType, json(event.relatedMemories),
      )
      if (Number(result.changes) === 0) return { saved: false, reason: 'duplicate' }
      this.lastSuccessfulWriteAt = new Date().toISOString()
      return { saved: true }
    } catch (error) {
      this.lastError = error instanceof Error ? error.name : 'database error'
      return { saved: false, reason: 'unavailable' }
    }
  }
  getEvent(id: string): MemoryEvent | null {
    const row = this.db?.prepare('SELECT * FROM memory_events WHERE id = ?').get(id)
    return row ? rowToEvent(row) : null
  }
  deleteEvent(id: string): boolean {
    if (!this.db) return false
    try {
      this.db.exec('BEGIN')
      const rows = this.db.prepare('SELECT id, source_event_ids_json FROM memory_orbs').all()
      for (const row of rows) {
        const ids = parseJson(row.source_event_ids_json) as string[] | null
        if (ids?.includes(id)) this.db.prepare('DELETE FROM memory_orbs WHERE id = ?').run(row.id)
      }
      const reflections = this.db.prepare('SELECT id, source_event_ids_json, summary, lesson FROM memory_reflections').all()
      for (const row of reflections) {
        const ids = parseJson(row.source_event_ids_json) as string[] | null
        if (ids?.includes(id)) {
          this.db.prepare('DELETE FROM reflection_sources WHERE reflection_id = ?').run(row.id)
          this.db.prepare('DELETE FROM memory_reflections WHERE id = ?').run(row.id)
        }
      }
      const deleted = Number(this.db.prepare('DELETE FROM memory_events WHERE id = ?').run(id).changes) > 0
      this.db.exec('COMMIT')
      return deleted
    } catch {
      try { this.db.exec('ROLLBACK') } catch {}
      return false
    }
  }
  listSessionEvents(sessionId: string): MemoryEvent[] {
    const rows = this.db?.prepare('SELECT * FROM memory_events WHERE session_id = ? ORDER BY event_seq IS NULL, event_seq, timestamp').all(sessionId) ?? []
    return rows.map(rowToEvent)
  }
  listRecentEvents(limit = 100): MemoryEvent[] {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)))
    const rows = this.db?.prepare('SELECT * FROM memory_events ORDER BY timestamp DESC, rowid DESC LIMIT ?').all(safeLimit) ?? []
    return rows.map(rowToEvent)
  }
  saveOrb(orb: MemoryOrb): SaveOrbResult {
    if (!this.config.enabled) return { saved: false, reason: 'disabled' }
    if (!this.config.analysisEnabled) return { saved: false, reason: 'analysis_disabled' }
    if (!this.db) return { saved: false, reason: this.lastError ? 'unavailable' : 'closed' }
    const dedupeKey = orb.sourceEventIds.slice().sort().join(',') + '|' + orb.analysisVersion
    try {
      const result = this.db.prepare(`
        INSERT OR IGNORE INTO memory_orbs (
          id, dedupe_key, source_event_ids_json, session_id, actor, timestamp,
          emotions_json, emotion_confidence, meaning, meaning_confidence, importance,
          importance_reasons_json, core_memory_candidate, tags_json, related_memory_ids_json,
          evidence_event_ids_json, analysis_method, analysis_version, review_status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orb.id, dedupeKey, json(orb.sourceEventIds) ?? '[]', orb.sessionId, orb.actor, orb.timestamp,
        json(orb.emotions) ?? '[]', orb.emotionConfidence, orb.meaning, orb.meaningConfidence,
        orb.importance, json(orb.importanceReasons) ?? '[]', orb.coreMemoryCandidate ? 1 : 0,
        json(orb.tags) ?? '[]', json(orb.relatedMemoryIds) ?? '[]', json(orb.evidenceEventIds) ?? '[]',
        orb.analysisMethod, orb.analysisVersion, orb.reviewStatus, orb.createdAt, orb.updatedAt,
      )
      return Number(result.changes) === 0 ? { saved: false, reason: 'duplicate' } : { saved: true }
    } catch (error) {
      this.lastError = error instanceof Error ? error.name : 'database error'
      return { saved: false, reason: 'unavailable' }
    }
  }
  getOrb(id: string): MemoryOrb | null {
    const row = this.db?.prepare('SELECT * FROM memory_orbs WHERE id = ?').get(id)
    return row ? rowToOrb(row) : null
  }
  listOrbsForEvent(eventId: string): MemoryOrb[] {
    const rows = this.db?.prepare('SELECT * FROM memory_orbs ORDER BY timestamp').all() ?? []
    return rows.filter((row) => (parseJson(row.source_event_ids_json) as string[] | null)?.includes(eventId)).map(rowToOrb)
  }
  listSessionOrbs(sessionId: string): MemoryOrb[] {
    return (this.db?.prepare('SELECT * FROM memory_orbs WHERE session_id = ? ORDER BY timestamp').all(sessionId) ?? []).map(rowToOrb)
  }
  listRecentOrbs(limit = 100): MemoryOrb[] {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)))
    return (this.db?.prepare('SELECT * FROM memory_orbs ORDER BY timestamp DESC, rowid DESC LIMIT ?').all(safeLimit) ?? []).map(rowToOrb)
  }
  listOrbsByEmotion(emotion: string): MemoryOrb[] {
    return (this.db?.prepare('SELECT * FROM memory_orbs ORDER BY timestamp').all() ?? [])
      .filter((row) => (parseJson(row.emotions_json) as string[] | null)?.includes(emotion)).map(rowToOrb)
  }
  listCoreMemoryCandidates(limit = 100): MemoryOrb[] {
    const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)))
    return (this.db?.prepare('SELECT * FROM memory_orbs WHERE core_memory_candidate = 1 ORDER BY importance DESC, timestamp DESC LIMIT ?').all(safeLimit) ?? []).map(rowToOrb)
  }
  updateOrb(orb: MemoryOrb): boolean {
    if (!this.db) return false
    try {
      const result = this.db.prepare(`
        UPDATE memory_orbs SET emotions_json = ?, emotion_confidence = ?, meaning = ?,
        meaning_confidence = ?, importance = ?, importance_reasons_json = ?,
        core_memory_candidate = ?, tags_json = ?, related_memory_ids_json = ?,
        review_status = ?, updated_at = ? WHERE id = ?
      `).run(
        json(orb.emotions) ?? '[]', orb.emotionConfidence, orb.meaning, orb.meaningConfidence,
        orb.importance, json(orb.importanceReasons) ?? '[]', orb.coreMemoryCandidate ? 1 : 0,
        json(orb.tags) ?? '[]', json(orb.relatedMemoryIds) ?? '[]', orb.reviewStatus, orb.updatedAt, orb.id,
      )
      return Number(result.changes) > 0
    } catch { return false }
  }
  deleteOrb(id: string): boolean {
    if (!this.db) return false
    try { return Number(this.db.prepare('DELETE FROM memory_orbs WHERE id = ?').run(id).changes) > 0 } catch { return false }
  }
  saveReflection(reflection: ReflectionRecord): SaveReflectionResult {
    if (!this.config.enabled) return { saved: false, reason: 'disabled' }
    if (!this.config.reflectionEnabled) return { saved: false, reason: 'reflection_disabled' }
    if (!this.db) return { saved: false, reason: this.lastError ? 'unavailable' : 'closed' }
    const dedupeKey = reflection.sourceEventIds.slice().sort().join(',') + '|' + reflection.reflectionType + '|' + reflection.analysisVersion
    try {
      const result = this.db.prepare(`
        INSERT OR IGNORE INTO memory_reflections (
          id, dedupe_key, reflection_type, title, summary, lesson, source_event_ids_json,
          source_orb_ids_json, session_ids_json, evidence_status, confidence,
          verification_status, analysis_method, analysis_version, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reflection.id, dedupeKey, reflection.reflectionType, reflection.title, reflection.summary, reflection.lesson,
        json(reflection.sourceEventIds) ?? '[]', json(reflection.sourceOrbIds) ?? '[]', json(reflection.sessionIds) ?? '[]',
        reflection.evidenceStatus, reflection.confidence, reflection.verificationStatus, reflection.analysisMethod,
        reflection.analysisVersion, reflection.createdAt, reflection.updatedAt,
      )
      if (Number(result.changes) === 0) return { saved: false, reason: 'duplicate' }
      const source = this.db.prepare('INSERT OR IGNORE INTO reflection_sources(reflection_id, event_id) VALUES (?, ?)')
      for (const eventId of reflection.sourceEventIds) source.run(reflection.id, eventId)
      return { saved: true }
    } catch (error) {
      this.lastError = error instanceof Error ? error.name : 'database error'
      return { saved: false, reason: 'unavailable' }
    }
  }
  getReflection(id: string): ReflectionRecord | null {
    const row = this.db?.prepare('SELECT * FROM memory_reflections WHERE id = ?').get(id)
    return row ? rowToReflection(row) : null
  }
  listReflections(options: { sessionId?: string; type?: ReflectionRecord['reflectionType']; limit?: number } = {}): ReflectionRecord[] {
    const limit = Math.max(1, Math.min(1000, Math.floor(options.limit ?? 100)))
    const rows = this.db?.prepare('SELECT * FROM memory_reflections ORDER BY updated_at DESC LIMIT ?').all(limit) ?? []
    return rows.map(rowToReflection).filter((reflection) =>
      (!options.sessionId || reflection.sessionIds.includes(options.sessionId)) &&
      (!options.type || reflection.reflectionType === options.type))
  }
  updateReflection(reflection: ReflectionRecord): boolean {
    if (!this.db) return false
    try {
      const result = this.db.prepare(`
        UPDATE memory_reflections SET title = ?, summary = ?, lesson = ?, evidence_status = ?,
        confidence = ?, verification_status = ?, updated_at = ? WHERE id = ?
      `).run(reflection.title, reflection.summary, reflection.lesson, reflection.evidenceStatus,
        reflection.confidence, reflection.verificationStatus, reflection.updatedAt, reflection.id)
      return Number(result.changes) > 0
    } catch { return false }
  }
  deleteReflection(id: string): boolean {
    if (!this.db) return false
    try {
      this.db.exec('BEGIN')
      const changed = Number(this.db.prepare('DELETE FROM memory_reflections WHERE id = ?').run(id).changes) > 0
      this.db.prepare('DELETE FROM reflection_sources WHERE reflection_id = ?').run(id)
      this.db.exec('COMMIT')
      return changed
    } catch {
      try { this.db.exec('ROLLBACK') } catch {}
      return false
    }
  }
  deleteSession(sessionId: string): boolean {
    if (!this.db) return false
    try {
      this.db.exec('BEGIN')
      const changed = Number(this.db.prepare('DELETE FROM memory_events WHERE session_id = ?').run(sessionId).changes) > 0
      this.db.prepare('DELETE FROM memory_orbs WHERE session_id = ?').run(sessionId)
      const reflections = this.db.prepare('SELECT id, session_ids_json FROM memory_reflections').all()
      for (const row of reflections) {
        const sessions = parseJson(row.session_ids_json) as string[] | null
        if (sessions?.includes(sessionId)) {
          this.db.prepare('DELETE FROM reflection_sources WHERE reflection_id = ?').run(row.id)
          this.db.prepare('DELETE FROM memory_reflections WHERE id = ?').run(row.id)
        }
      }
      this.db.exec('COMMIT')
      return changed
    } catch {
      try { this.db.exec('ROLLBACK') } catch {}
      return false
    }
  }
  clearAllMemories(): boolean {
    if (!this.db) return false
    try {
      this.db.exec('BEGIN')
      this.db.prepare('DELETE FROM memory_orbs').run()
      this.db.prepare('DELETE FROM reflection_sources').run()
      this.db.prepare('DELETE FROM memory_reflections').run()
      this.db.prepare('DELETE FROM memory_events').run()
      this.db.exec('COMMIT')
      return true
    } catch {
      try { this.db.exec('ROLLBACK') } catch {}
      return false
    }
  }
  getMemoryStats(): MemoryStats {
    if (!this.config.enabled) return { pluginVersion: PLUGIN_VERSION, enabled: false, databaseStatus: 'disabled', eventCount: 0, sessionCount: 0, lastSuccessfulWriteAt: this.lastSuccessfulWriteAt }
    if (!this.db) return { pluginVersion: PLUGIN_VERSION, enabled: true, databaseStatus: this.lastError ? 'unavailable' : 'closed', eventCount: 0, sessionCount: 0, lastSuccessfulWriteAt: this.lastSuccessfulWriteAt }
    try {
      const count = this.db.prepare('SELECT COUNT(*) AS count FROM memory_events').get()
      const sessions = this.db.prepare('SELECT COUNT(DISTINCT session_id) AS count FROM memory_events').get()
      return { pluginVersion: PLUGIN_VERSION, enabled: true, databaseStatus: 'ready', eventCount: Number(count?.count ?? 0), sessionCount: Number(sessions?.count ?? 0), lastSuccessfulWriteAt: this.lastSuccessfulWriteAt }
    } catch {
      return { pluginVersion: PLUGIN_VERSION, enabled: true, databaseStatus: 'unavailable', eventCount: 0, sessionCount: 0, lastSuccessfulWriteAt: this.lastSuccessfulWriteAt }
    }
  }
  close(): void {
    if (!this.db) return
    try { this.db.close() } finally { this.db = null }
  }
}
