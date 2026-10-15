import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { parseManifest, projectManifest } from '@dsh-std/manifest'

const text = fs.readFileSync(new URL('../dsh-plugin.json', import.meta.url), 'utf8')
test('manifest parses as Community dsh-plugin 0.15', () => {
  const manifest = parseManifest(text, { source: 'dsh-plugin.json' })
  assert.equal(manifest.manifestVersion, '0.15')
  assert.equal(manifest.version, '0.5.0')
  const projection = projectManifest(manifest)
  assert.ok(projection.spec.facets.some((facet) => facet.name === 'host'))
  assert.deepEqual(manifest.contributes['x-tool-namespaces'][0].tools, ['inside_memory_ping', 'inside_memory_status', 'inside_memory_recall'])
})
