import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { MemoryCapture } from '../dist/memory/capture.js'
import { resolveMemoryConfig } from '../dist/memory/config.js'
import { MemoryStorage } from '../dist/memory/storage.js'
import { LocalRuleAnalyzer, createUnavailableModelProvider } from '../dist/memory/orb/analyzer.js'
import { MemoryOrbService } from '../dist/memory/orb/service.js'
import { colorForEmotion } from '../dist/memory/orb/colors.js'
import { scoreImportance } from '../dist/memory/orb/importance.js'

function storageFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-orb-'))
  const storage = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, analysisEnabled: true, databasePath: join(directory, 'memory.sqlite') }
  }))
  return { directory, storage }
}

test('local analysis supports multiple user emotions with uncertainty', () => {
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'orb-session' }, {
    type: 'user/message', id: 'orb-event-1', content: '我很担心这个目标，但也期待成功，请记住'
  })
  const analysis = new LocalRuleAnalyzer().analyze(event)
  assert.ok(analysis.emotions.includes('fear'))
  assert.ok(analysis.emotions.includes('anticipation'))
  assert.ok(analysis.emotionConfidence < 1)
  assert.equal(analysis.reviewStatus, 'needs_review')
})

test('assistant analysis records behavior style without claiming AI emotion', () => {
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'style-session' }, {
    type: 'assistant/message', id: 'style-event', content: '我会分析步骤，也可能需要确认'
  })
  const analysis = new LocalRuleAnalyzer().analyze(event)
  assert.deepEqual(analysis.emotions, ['neutral'])
  assert.ok(analysis.tags.includes('analytical'))
  assert.ok(analysis.tags.includes('cautious'))
  assert.equal(analysis.meaning.includes('internal emotion'), true)
})

test('technical text remains neutral and importance has explainable evidence', () => {
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'importance-session' }, {
    type: 'user/message', id: 'important-event', content: '请记住这个项目目标，这是长期计划'
  })
  const technical = capture.capture({ id: 'importance-session' }, {
    type: 'user/message', id: 'technical-event', content: 'const value = 1;'
  })
  const neutral = new LocalRuleAnalyzer().analyze(technical)
  const score = scoreImportance(event)
  assert.deepEqual(neutral.emotions, ['neutral'])
  assert.ok(score.score >= 0.7)
  assert.equal(score.coreMemoryCandidate, true)
  assert.ok(score.reasons.length > 0)
})

test('orb is persisted, deduplicated, queryable and removed with its source event', async () => {
  const { directory, storage } = storageFixture()
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'persist-orb-session' }, {
    type: 'user/message', id: 'persist-orb-event', content: '请记住这个重要目标'
  })
  assert.equal(storage.saveEvent(event).saved, true)
  const service = new MemoryOrbService(storage, new LocalRuleAnalyzer(), { now: () => '2026-01-01T01:00:00.000Z' })
  assert.equal(service.enqueue(event), true)
  await service.flush()
  const orbs = storage.listSessionOrbs('persist-orb-session')
  assert.equal(orbs.length, 1)
  assert.equal(orbs[0].sourceEventIds[0], 'persist-orb-event')
  assert.equal(storage.saveOrb(orbs[0]).reason, 'duplicate')
  assert.equal(storage.listOrbsByEmotion('anticipation').length, 1)
  assert.equal(colorForEmotion(orbs[0].emotions[0]).color.length > 0, true)
  service.close()
  storage.close()
  const reopened = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, analysisEnabled: true, databasePath: join(directory, 'memory.sqlite') }
  }))
  assert.equal(reopened.listSessionOrbs('persist-orb-session').length, 1)
  assert.equal(reopened.deleteEvent('persist-orb-event'), true)
  assert.equal(reopened.listSessionOrbs('persist-orb-session').length, 0)
  reopened.close()
  rmSync(directory, { recursive: true, force: true })
})

test('analysis queue is bounded and unavailable model provider is explicit', async () => {
  const { directory, storage } = storageFixture()
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const service = new MemoryOrbService(storage, new LocalRuleAnalyzer(), { maxQueue: 1 })
  const first = capture.capture({ id: 'queue-session' }, { type: 'user/message', id: 'q1', content: 'hello' })
  const second = capture.capture({ id: 'queue-session' }, { type: 'user/message', id: 'q2', content: 'hello' })
  assert.equal(service.enqueue(first), true)
  assert.equal(service.enqueue(second), false)
  await service.flush()
  await assert.rejects(() => createUnavailableModelProvider().analyze(first), /No verified DSH model/)
  service.close()
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})

test('analyzer failure does not write a partial or fabricated orb', async () => {
  const { directory, storage } = storageFixture()
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'failure-session' }, { type: 'user/message', id: 'failure-event', content: 'hello' })
  assert.equal(storage.saveEvent(event).saved, true)
  const service = new MemoryOrbService(storage, { analyze() { throw new Error('invalid analysis') } })
  assert.equal(service.enqueue(event), true)
  await service.flush()
  assert.equal(storage.listSessionOrbs('failure-session').length, 0)
  service.close()
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})

test('migrates a v0.3 database without losing its original event', () => {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-migration-'))
  const path = join(directory, 'memory.sqlite')
  const oldDb = new DatabaseSync(path)
  oldDb.exec(`
    CREATE TABLE schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    INSERT INTO schema_version VALUES (1, '2026-01-01T00:00:00.000Z');
    CREATE TABLE memory_events (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL, event_seq INTEGER, timestamp TEXT NOT NULL,
      actor TEXT NOT NULL, event_type TEXT NOT NULL, content_json TEXT, source_json TEXT NOT NULL,
      call_id TEXT, related_event_ids_json TEXT NOT NULL, capture_status TEXT NOT NULL,
      created_at TEXT NOT NULL, data_version INTEGER NOT NULL DEFAULT 1, candidate_type TEXT,
      emotions_json TEXT, meaning TEXT, importance REAL, confidence REAL, memory_type TEXT,
      related_memories_json TEXT
    );
    INSERT INTO memory_events VALUES (
      'legacy-event', 'legacy-session', 1, '2026-01-01T00:00:00.000Z', 'user',
      'user_message', '"legacy"', '{"kind":"dsh_session_event"}', NULL, '[]', 'captured',
      '2026-01-01T00:00:00.000Z', 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    );
  `)
  oldDb.close()
  const storage = new MemoryStorage(resolveMemoryConfig({ memory: { enabled: true, databasePath: path } }))
  assert.equal(storage.getEvent('legacy-event').content, 'legacy')
  assert.equal(storage.listSessionOrbs('legacy-session').length, 0)
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})
