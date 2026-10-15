import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryCapture } from '../dist/memory/capture.js'
import { resolveMemoryConfig } from '../dist/memory/config.js'
import { MemoryStorage } from '../dist/memory/storage.js'
import { MemoryRecallService } from '../dist/memory/recall/service.js'

test('recall returns evidence-backed user and assistant history with bounded context', () => {
  const directory = mkdtempSync(join(tmpdir(), 'everlasting-ally-recall-'))
  const storage = new MemoryStorage(resolveMemoryConfig({ memory: {
    enabled: true, recallEnabled: true, databasePath: join(directory, 'memory.sqlite')
  } }))
  const capture = new MemoryCapture(undefined, () => '2026-01-01T00:00:00.000Z')
  const user = capture.capture({ id: 'recall-session' }, {
    type: 'user/message', id: 'recall-user', content: '我们讨论过项目的长期目标'
  })
  const assistant = capture.capture({ id: 'recall-session' }, {
    type: 'assistant/message', id: 'recall-assistant', content: '我会分析这个项目目标'
  })
  assert.equal(storage.saveEvent(user).saved, true)
  assert.equal(storage.saveEvent(assistant).saved, true)
  const result = new MemoryRecallService(storage).search('项目目标', { maxResults: 2, maxChars: 240 })
  assert.equal(result.found, true)
  assert.ok(result.evidenceEventIds.includes('recall-user'))
  assert.ok(result.summary.length <= 240)
  const empty = new MemoryRecallService(storage).search('完全不存在的主题')
  assert.equal(empty.found, false)
  assert.equal(empty.summary, '未找到足够可靠的记忆。')
  storage.close()
  rmSync(directory, { recursive: true, force: true })
})
