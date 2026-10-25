import test from 'node:test'
import assert from 'node:assert/strict'
import { HostAdapter, detectHostCapabilities } from '../dist/host-adapter.js'

function fakeHost({ on, effect, inject } = {}) {
  const definitions = new Map()
  const host = {
    inject: inject ?? ((_services, callback) => callback({
      tools: { register(definition) { definitions.set(definition.name, definition); return () => definitions.delete(definition.name) } },
      effect() {},
    })),
    ...(on ? { on } : {}),
    ...(effect ? { effect } : {}),
  }
  return { host, definitions }
}

test('reports optional seams as unsupported and never claims an unverified API', () => {
  const { host } = fakeHost()
  const diagnostics = detectHostCapabilities(host)
  assert.equal(diagnostics.capabilities.tools.available, true)
  assert.equal(diagnostics.capabilities.eventSubscription.available, false)
  assert.equal(diagnostics.capabilities.lifecycleEffects.available, false)
  assert.equal(diagnostics.apiVersion, 'unverified')
  assert.equal(diagnostics.hostVersion, null)
})

test('registers tools and cleans up through the adapter', () => {
  const events = []
  const { host, definitions } = fakeHost({
    on(event) { events.push(event); return () => events.pop() },
    effect() {},
  })
  const adapter = new HostAdapter(host)
  adapter.injectTools(({ tools, effect }) => {
    const unregister = tools.register({ name: 'x', description: '', parameters: {}, output: { schema: {}, render: () => [] }, execute: async () => ({}) })
    effect(() => unregister, 'test tool')
  })
  adapter.subscribe('session/event', () => {})
  assert.equal(definitions.has('x'), true)
  adapter.stop()
  assert.equal(definitions.has('x'), false)
  assert.equal(events.length, 0)
})

test('startup failure cleans resources and repeated lifecycle calls are safe', () => {
  let closed = 0
  const adapter = new HostAdapter(fakeHost().host)
  adapter.registerCleanup(() => { closed += 1 })
  assert.throws(() => adapter.start(() => { throw new Error('boom') }), /boom/)
  assert.equal(closed, 1)
  assert.equal(adapter.diagnostics.state, 'stopped')
  assert.throws(() => adapter.start(), /already stopped/)
  adapter.stop()
})

test('required tool injection failure is explicit and does not read credentials or network', () => {
  const adapter = new HostAdapter(fakeHost({ inject: () => { throw new Error('tools unavailable') } }).host)
  assert.throws(() => adapter.injectTools(() => {}), /tools unavailable/)
  assert.equal(adapter.diagnostics.state, 'stopped')
})

test('adapter capability detection is pure and reports missing required injection', () => {
  const diagnostics = detectHostCapabilities({ inject: undefined })
  assert.equal(diagnostics.capabilities.tools.available, false)
  assert.equal(diagnostics.capabilities.eventSubscription.available, false)
  assert.equal(diagnostics.capabilities.lifecycleEffects.available, false)
})

