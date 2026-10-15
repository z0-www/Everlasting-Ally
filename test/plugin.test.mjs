import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, TOOL_NAME } from '../dist/index.js'

test('registers inside_memory_ping and unregisters it through the effect', async () => {
  const definitions = new Map()
  const cleanups = []
  const host = {
    inject(_services, callback) {
      callback({
        tools: {
          register(definition) {
            definitions.set(definition.name, definition)
            return () => definitions.delete(definition.name)
          }
        },
        effect(setup) { cleanups.push(setup()) }
      })
    }
  }
  apply(host)
  assert.deepEqual([...definitions.keys()], [TOOL_NAME, 'inside_memory_status'])
  const definition = definitions.get(TOOL_NAME)
  const value = await definition.execute({ message: 'hello' })
  assert.deepEqual(value, { ok: true, plugin: 'everlasting-ally', message: 'hello' })
  assert.deepEqual(definition.output.render({}, value), [{ type: 'text', text: JSON.stringify(value) }])
  const status = await definitions.get('inside_memory_status').execute({})
  assert.equal(status.pluginVersion, '0.4.0')
  assert.equal(status.enabled, false)
  assert.equal(status.databaseStatus, 'disabled')
  for (const cleanup of cleanups) cleanup?.()
  assert.equal(definitions.size, 0)
})

test('uses a deterministic default message for missing input', async () => {
  let definition
  apply({ inject(_services, callback) {
    callback({ tools: { register(value) {
      if (value.name === TOOL_NAME) definition = value
      return () => {}
    } }, effect() {} })
  } })
  assert.equal((await definition.execute({})).message, 'Everlasting Ally is loaded.')
})
