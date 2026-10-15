import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryCapture } from '../dist/memory/capture.js'
import { resolveMemoryConfig } from '../dist/memory/config.js'
import { MemoryStorage } from '../dist/memory/storage.js'

function fixture(config = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-test-'))
  const storage = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, databasePath: join(directory, 'memory.sqlite'), ...config }
  }))
  return { directory, storage }
}

test('initializes SQLite and persists both directions across reopen', () => {
  const first = fixture()
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const session = { id: 'persistent-session' }
  const events = [
    capture.capture(session, { type: 'user/message', id: 'user-1', seq: 1, content: 'hello' }),
    capture.capture(session, { type: 'assistant/message', id: 'assistant-1', seq: 2, content: 'hi' }),
    capture.capture(session, { type: 'tool/call', id: 'call-event', seq: 3, callId: 'call-1', arguments: { q: 'x' } }),
    capture.capture(session, { type: 'tool/result', id: 'result-event', seq: 4, callId: 'call-1', result: { ok: true } }),
  ]
  for (const event of events) assert.equal(first.storage.saveEvent(event).saved, true)
  assert.equal(first.storage.saveEvent(events[0]).reason, 'duplicate')
  assert.equal(first.storage.listSessionEvents('persistent-session').length, 4)
  assert.deepEqual(first.storage.getEvent('result-event').relatedEventIds, ['call-event'])
  assert.equal(first.storage.getMemoryStats().sessionCount, 1)
  first.storage.close()

  const reopened = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, databasePath: join(first.directory, 'memory.sqlite') }
  }))
  assert.equal(reopened.listSessionEvents('persistent-session').length, 4)
  assert.equal(reopened.getMemoryStats().eventCount, 4)
  reopened.close()
  rmSync(first.directory, { recursive: true, force: true })
})

test('defaults to disabled persistence and supports session/all deletion', () => {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-disabled-'))
  const disabled = new MemoryStorage(resolveMemoryConfig({ databasePath: join(directory, 'memory.sqlite') }))
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'disabled-session' }, { type: 'user/message', id: 'disabled-1', content: 'private' })
  assert.deepEqual(disabled.saveEvent(event), { saved: false, reason: 'disabled' })
  assert.equal(disabled.getMemoryStats().databaseStatus, 'disabled')
  disabled.close()

  const active = new MemoryStorage(resolveMemoryConfig({ memory: { enabled: true, databasePath: join(directory, 'memory.sqlite') } }))
  assert.equal(active.saveEvent(event).saved, true)
  assert.equal(active.deleteSession('disabled-session'), true)
  assert.equal(active.getEvent('disabled-1'), null)
  assert.equal(active.clearAllMemories(), true)
  assert.equal(active.getMemoryStats().eventCount, 0)
  active.close()
  rmSync(directory, { recursive: true, force: true })
})

test('redacts credential-shaped fields and enforces the content size limit', () => {
  const { directory, storage } = fixture({ maxEventBytes: 1000 })
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const sensitive = capture.capture({ id: 'privacy-session' }, {
    type: 'tool/call', id: 'privacy-1', callId: 'privacy-call',
    arguments: { token: 'super-secret-token', nested: { password: 'pw-value' }, visible: 'ok' }
  })
  assert.equal(storage.saveEvent(sensitive).saved, true)
  const stored = storage.getEvent('privacy-1')
  assert.equal(stored.content.token, '[REDACTED]')
  assert.equal(stored.content.nested.password, '[REDACTED]')
  assert.equal(stored.content.visible, 'ok')

  const oversizedStorage = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, databasePath: join(directory, 'oversized.sqlite'), maxEventBytes: 10 }
  }))
  const oversized = capture.capture({ id: 'privacy-session' }, { type: 'user/message', id: 'oversized', content: '01234567890123456789' })
  assert.equal(oversizedStorage.saveEvent(oversized).saved, true)
  assert.equal(oversizedStorage.getEvent('oversized').content, null)
  assert.equal(oversizedStorage.getEvent('oversized').captureStatus, 'partial')
  storage.close()
  oversizedStorage.close()
  rmSync(directory, { recursive: true, force: true })
})

test('database errors are reported as a result and do not throw during capture', () => {
  const { directory, storage } = fixture()
  const capture = new MemoryCapture((event) => storage.saveEvent(event), () => '2026-01-01T00:00:00.000Z')
  storage.close()
  const event = capture.capture({ id: 'closed-session' }, { type: 'user/message', id: 'closed-1', content: 'not logged' })
  assert.deepEqual(storage.saveEvent(event), { saved: false, reason: 'closed' })
  rmSync(directory, { recursive: true, force: true })
})
