import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryCapture } from '../dist/memory/capture.js'
import { resolveMemoryConfig } from '../dist/memory/config.js'
import { MemoryStorage } from '../dist/memory/storage.js'
import { LocalReflectionAnalyzer, createUnavailableReflectionProvider } from '../dist/memory/reflection/analyzer.js'
import { ReflectionService } from '../dist/memory/reflection/service.js'

function fixture(overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-reflection-'))
  const storage = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, reflectionEnabled: true, databasePath: join(directory, 'memory.sqlite'), ...overrides }
  }))
  return { directory, storage }
}

function budget(enabled = true) {
  return {
    reflectionEnabled: enabled, modelReflectionEnabled: false, maxReflectionEvents: 20,
    maxInputChars: 4000, maxOutputChars: 1000, maxModelCalls: 0, maxTokensPerRun: 0, reflectionTimeoutMs: 1000,
  }
}

test('reflects tool failure and user correction with traceable evidence', () => {
  const { directory, storage } = fixture()
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const session = { id: 'reflection-session' }
  const events = [
    capture.capture(session, { type: 'user/message', id: 'r-user', seq: 1, content: '请帮我配置项目' }),
    capture.capture(session, { type: 'assistant/message', id: 'r-assistant', seq: 2, content: '我已完成配置' }),
    capture.capture(session, { type: 'tool/call', id: 'r-call', seq: 3, callId: 'r-call-id', arguments: { version: 'old' } }),
    capture.capture(session, { type: 'tool/result', id: 'r-result', seq: 4, callId: 'r-call-id', result: { ok: false, error: 'compatibility failure' } }),
    capture.capture(session, { type: 'user/message', id: 'r-correction', seq: 5, content: '不对，应该使用新版本' }),
  ]
  for (const event of events) storage.saveEvent(event)
  const service = new ReflectionService(storage, budget())
  const records = service.reflectSession('reflection-session')
  assert.ok(records.some((record) => record.reflectionType === 'mistake'))
  assert.ok(records.some((record) => record.reflectionType === 'correction'))
  assert.ok(records.some((record) => record.reflectionType === 'unresolved'))
  assert.ok(records.every((record) => record.sourceEventIds.includes('r-result')))
  assert.equal(records.some((record) => record.reflectionType === 'verified_success'), false)
  assert.equal(service.reflectSession('reflection-session').length, records.length)
  assert.equal(storage.listReflections({ sessionId: 'reflection-session' }).length, records.length)
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})

test('reflection survives restart and deletion removes derived records', () => {
  const { directory, storage } = fixture()
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'restart-session' }, { type: 'user/message', id: 'restart-event', content: '普通问题' })
  storage.saveEvent(event)
  const service = new ReflectionService(storage, budget())
  const records = service.reflectSession('restart-session')
  assert.equal(records.length, 1)
  storage.close()
  const reopened = new MemoryStorage(resolveMemoryConfig({
    memory: { enabled: true, reflectionEnabled: true, databasePath: join(directory, 'memory.sqlite') }
  }))
  assert.equal(reopened.getReflection(records[0].id).sourceEventIds[0], 'restart-event')
  assert.equal(reopened.deleteEvent('restart-event'), true)
  assert.equal(reopened.listReflections({ sessionId: 'restart-session' }).length, 0)
  reopened.close()
  rmSync(directory, { recursive: true, force: true })
})

test('disabled reflection and unavailable model provider do not execute or write', async () => {
  const { directory, storage } = fixture({ reflectionEnabled: false })
  const service = new ReflectionService(storage, budget(false))
  assert.deepEqual(service.reflectSession('missing'), [])
  await assert.rejects(() => createUnavailableReflectionProvider().analyze({ events: [], orbs: [] }), /No verified DSH reflection/)
  assert.equal(storage.listReflections().length, 0)
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})

test('local analyzer never confirms success from an assistant claim alone', () => {
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const event = capture.capture({ id: 'claim-session' }, { type: 'assistant/message', id: 'claim', content: '已完成全部工作' })
  const records = new LocalReflectionAnalyzer().analyze({ events: [event], orbs: [] })
  assert.equal(records.some((record) => record.reflectionType === 'verified_success'), false)
  assert.equal(records[0].verificationStatus, 'needs_review')
})
