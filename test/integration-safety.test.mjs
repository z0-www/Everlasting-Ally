import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryCapture } from '../dist/memory/capture.js'
import { resolveMemoryConfig } from '../dist/memory/config.js'
import { MemoryStorage } from '../dist/memory/storage.js'
import { MemoryRecallService } from '../dist/memory/recall/service.js'
import { AutoRecallService } from '../dist/memory/auto-recall/service.js'

test('capture cache is bounded and derived analysis receives sanitized content', () => {
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z', undefined, { maxRetainedEvents: 2 })
  const first = capture.capture({ id: 'safety-session' }, { type: 'user/message', id: 'safe-1', content: 'token: secret-value' })
  capture.capture({ id: 'safety-session' }, { type: 'user/message', id: 'safe-2', content: 'two' })
  capture.capture({ id: 'safety-session' }, { type: 'user/message', id: 'safe-3', content: 'three' })
  assert.equal(capture.events.length, 2)
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-safety-'))
  const storage = new MemoryStorage(resolveMemoryConfig({ memory: {
    enabled: true, databasePath: join(directory, 'memory.sqlite')
  } }))
  const result = storage.saveEvent(first)
  assert.equal(result.saved, true)
  assert.equal(result.storedEvent.content, '[REDACTED]')
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})

test('auto recall remains safe when the DSH request hook is unavailable or scope differs', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-auto-'))
  const storage = new MemoryStorage(resolveMemoryConfig({ memory: {
    enabled: true, recallEnabled: true, autoRecallEnabled: true, databasePath: join(directory, 'memory.sqlite')
  } }))
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'auto-session' }, { type: 'user/message', id: 'auto-event', content: '项目问题' })
  storage.saveEvent(event)
  const service = new AutoRecallService(new MemoryRecallService(storage), {
    enabled: true, maxResults: 3, maxChars: 500, minScore: 0.1, timeoutMs: 500,
  })
  const result = await service.process({ event, scopeId: 'local-user' })
  assert.equal(result.injected, false)
  assert.equal(result.reason, 'hook_unavailable')
  const denied = await service.process({ event, scopeId: 'another-user' })
  assert.equal(denied.reason, 'no_reliable_memory')
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})
