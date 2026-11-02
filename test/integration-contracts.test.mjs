// Simulated Host contracts, NOT real DSH Desktop acceptance.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { apply, mountMemoryRuntime, HostAdapter } from '../dist/index.js'
import { resolveIntegrationConfig } from '../dist/integration/config.js'
import { SqliteMemoryReader } from '../dist/memory/provider.js'
import { MemoryStorage } from '../dist/memory/storage.js'
import { MemoryCapture } from '../dist/memory/capture.js'
import { resolveMemoryConfig } from '../dist/memory/config.js'
function host(failAt = 0) {
  const cleanups = [], definitions = new Map()
  let listener, registrations = 0
  const root = {
    effect(setup) { cleanups.push(setup()) },
    on(_, fn) { listener = fn; return () => { listener = undefined } },
    inject(_, callback) { callback({
      effect: root.effect,
      tools: { register(definition) {
        if (++registrations === failAt) throw Error('register failed')
        definitions.set(definition.name, definition)
        return () => definitions.delete(definition.name)
      } },
    }) },
  }
  return { root, definitions, emit(...args) { listener?.(...args) }, stop() { for (const fn of cleanups.reverse()) fn?.() } }
}
function temporary(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'ally-contract-'))
  try { fn(join(dir, 'memory.sqlite')) }
  finally { rmSync(dir, { recursive: true }) }
}
test('simulated unload closes SQLite, preserves saved events and allows restart', () => temporary(databasePath => {
  const h = host(), config = { memory: { enabled: true, databasePath } }
  apply(h.root, config)
  const runtime = mountMemoryRuntime(h.root, config)
  apply(h.root, config)
  assert.equal(h.definitions.size, 4)
  h.emit({id:'s'}, {type:'user/message',id:'u',content:'Atlas project'})
  assert.equal(runtime.storage.getMemoryStats().eventCount, 1)
  h.stop()
  assert.equal(runtime.storage.getMemoryStats().databaseStatus, 'closed')
  assert.equal(h.definitions.size, 0)
  h.emit({id:'s'}, {type:'user/message',id:'late',content:'ignored'})
  assert.equal(runtime.capture.events.length, 1)
  apply(h.root, config)
  const restarted = mountMemoryRuntime(h.root, config)
  try { assert.equal(restarted.storage.getMemoryStats().eventCount, 1); assert.equal(h.definitions.size, 4) }
  finally { restarted.adapter.stop() }
}))
test('simulated partial registration failure rolls back tools and database', () => temporary(databasePath => {
  const h = host(3), config = {memory:{enabled:true,databasePath}}
  const runtime = mountMemoryRuntime(h.root, config)
  assert.throws(() => apply(h.root, config), /register failed/)
  assert.equal(h.definitions.size, 0)
  assert.equal(runtime.storage.getMemoryStats().databaseStatus, 'closed')
}))
test('simulated subscription failure closes already created SQLite', t => temporary(databasePath => {
  const close = DatabaseSync.prototype.close
  let count = 0
  t.mock.method(DatabaseSync.prototype, 'close', function() { count++; return close.call(this) })
  assert.throws(() => mountMemoryRuntime({on(){throw Error('subscribe failed')}}, {memory:{enabled:true,databasePath}}), /subscribe failed/)
  assert.equal(count, 1)
}))
test('SQLite schema failure releases connection', t => temporary(databasePath => {
  const seed = new DatabaseSync(databasePath)
  seed.exec('CREATE TABLE memory_events (id TEXT)')
  seed.close()
  const close = DatabaseSync.prototype.close
  let count = 0
  t.mock.method(DatabaseSync.prototype, 'close', function() { count++; return close.call(this) })
  assert.throws(() => new MemoryStorage(resolveMemoryConfig({enabled:true,databasePath})))
  assert.equal(count, 1)
}))
test('simulated late injection and events are inert after stop', () => {
  let inject, listener, count=0
  const a = new HostAdapter({inject(_,fn){inject=fn},on(_,fn){listener=fn}})
  a.start(); a.injectTools(() => count++); a.subscribe('session/event', () => count++); a.stop()
  inject({}); listener({},{}); assert.equal(count,0)
})
test('simulated effect failure disposes already registered event', () => {
  let disposed=0
  const a = new HostAdapter({on(){return () => disposed++},effect(){throw Error('effect failed')}})
  assert.throws(() => a.subscribe('session/event', () => {}), /effect failed/)
  assert.equal(disposed,1)
})
test('persona draft cannot enable capture or injection or mutate config', () => temporary(databasePath => {
  const raw={memory:{databasePath},persona:{displayName:'Ally',tone:'friend',animeExpression:true}}
  const before=structuredClone(raw), h=host()
  apply(h.root,raw)
  try {
    h.emit({id:'s'},{type:'user/message',id:'u',content:'private'})
    assert.equal(existsSync(databasePath),false)
    assert.deepEqual(raw,before)
    assert.equal(resolveIntegrationConfig(raw).persona.enabled,false)
    assert.throws(() => resolveIntegrationConfig({persona:{enabled:true}}),/unverified/)
  } finally {h.stop()}
}))
test('invalid config fails before resource allocation', () => temporary(databasePath => {
  let touched=0
  assert.throws(() => apply({effect(){touched++}}, {memory:{enabled:'true',databasePath}}), /memory.enabled/)
  assert.equal(touched,0); assert.equal(existsSync(databasePath),false)
  assert.throws(() => resolveIntegrationConfig({enabled:true,memory:null}),/memory/)
  assert.throws(() => resolveIntegrationConfig({persona:{tone:'unknown'}}),/persona.tone/)
}))
test('memory reader borrows single database and enforces trusted scope', () => temporary(databasePath => {
  const storage=new MemoryStorage(resolveMemoryConfig({enabled:true,recallEnabled:true,scopeId:'trusted',databasePath}))
  try {
    storage.saveEvent(new MemoryCapture().capture({id:'s'},{type:'user/message',id:'u',content:'Atlas project database'}))
    const reader=new SqliteMemoryReader(storage)
    assert.equal(reader.search('Atlas','other').found,false)
    assert.equal(reader.search('Atlas','').found,false)
    assert.equal(reader.search('Atlas','trusted').found,true)
    assert.equal(reader.search('Atlas','other',{scopeId:'trusted'}).found,false)
    assert.equal(storage.getMemoryStats().eventCount,1)
    storage.close()
    assert.equal(reader.search('Atlas','trusted').found,false)
  } finally {storage.close()}
}))
test('legacy flat memory config works and persona stays separate', () => {
  assert.equal(resolveIntegrationConfig({enabled:true}).memory.enabled,true)
  assert.equal(resolveIntegrationConfig({persona:{animeExpression:true}}).memory.enabled,false)
})
