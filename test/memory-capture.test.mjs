import test from 'node:test'
import assert from 'node:assert/strict'
import { mountMemoryCapture } from '../dist/index.js'
import { MemoryCapture } from '../dist/memory/capture.js'

const clock = () => '2026-01-01T00:00:00.000Z'

test('captures user and assistant messages without inventing system text', () => {
  const capture = new MemoryCapture(undefined, clock)
  const session = { id: 'session-1' }
  const user = capture.capture(session, { type: 'user/message', seq: 1, content: 'hello', role: 'user' })
  const assistant = capture.capture(session, { type: 'assistant/message', seq: 2, text: 'hi', role: 'assistant' })
  const injected = capture.capture(session, { type: 'prompt/injected', seq: 3, content: 'hidden prompt' })

  assert.equal(user.actor, 'user')
  assert.equal(user.eventType, 'user_message')
  assert.equal(assistant.actor, 'assistant')
  assert.equal(assistant.candidateType, 'assistant_response')
  assert.equal(user.source.sessionId, 'session-1')
  assert.equal(user.createdAt, clock())
  assert.equal(injected, null)
  assert.equal(capture.events.length, 2)
})

test('captures tool calls and relates a result to the matching call', () => {
  const capture = new MemoryCapture(undefined, clock)
  const session = { header: { sessionId: 'session-tools' } }
  const call = capture.capture(session, {
    type: 'tool/call', seq: 10, callId: 'call-1', name: 'inside_memory_ping', arguments: { message: 'test' }
  })
  const result = capture.capture(session, {
    type: 'tool/result', seq: 11, callId: 'call-1', result: { ok: true }
  })

  assert.equal(call.actor, 'tool')
  assert.equal(call.eventType, 'tool_call')
  assert.deepEqual(result.relatedEventIds, [call.id])
  assert.deepEqual(result.content, { ok: true })
  assert.equal(result.callId, 'call-1')
})

test('marks incomplete known events partial and skips unknown sources', () => {
  const capture = new MemoryCapture(undefined, clock)
  const partial = capture.capture({ id: 'session-2' }, { type: 'assistant/message', seq: 1 })
  const wrongRole = capture.capture({ id: 'session-2' }, { type: 'user/message', role: 'assistant', content: 'not user' })
  const turn = capture.capture({ id: 'session-2' }, { type: 'turn/end', seq: 3 })

  assert.equal(partial.captureStatus, 'partial')
  assert.equal(wrongRole, null)
  assert.equal(turn.actor, 'system')
  assert.equal(turn.eventType, 'turn_end')
  assert.equal(turn.content, null)
})

test('mounts the DSH session/event listener and cleans up a returned disposer', () => {
  let listener
  let disposed = false
  const cleanups = []
  const root = {
    on(name, callback) {
      assert.equal(name, 'session/event')
      listener = callback
      return () => { disposed = true }
    },
    effect(setup) { cleanups.push(setup()) }
  }
  const capture = mountMemoryCapture(root)
  listener({ id: 'session-3' }, { type: 'user/message', seq: 1, content: 'captured' })
  assert.equal(capture.events.length, 1)
  for (const cleanup of cleanups) cleanup?.()
  assert.equal(disposed, true)
})
