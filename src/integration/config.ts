import { resolveMemoryConfig, type MemoryConfig } from '../memory/config.js'

export type PersonaDraft = Readonly<{
  enabled: false
  displayName: string
  tone: 'friend' | 'companion'
  animeExpression: boolean
}>
export type IntegrationConfig = { memory: MemoryConfig; persona: PersonaDraft }

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(path + ' must be an object')
  return value as Record<string, unknown>
}

/** Pure validation. A persona draft never authorizes prompt injection or memory capture. */
export function resolveIntegrationConfig(raw?: unknown): IntegrationConfig {
  const root = raw === undefined ? {} : record(raw, 'config')
  const memory = Object.hasOwn(root, 'memory') ? record(root.memory, 'memory') : root
  const defaults = resolveMemoryConfig()
  for (const [key, fallback] of Object.entries(defaults)) {
    if (!Object.hasOwn(memory, key)) continue
    const value = memory[key]
    if (typeof fallback === 'boolean' && typeof value !== 'boolean') throw new TypeError('memory.' + key + ' must be boolean')
    if (typeof fallback === 'string' && (typeof value !== 'string' || !value.trim())) throw new TypeError('memory.' + key + ' must be non-empty text')
    if (typeof fallback === 'number' && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 ||
        (key !== 'autoRecallMinScore' && !Number.isInteger(value)))) throw new TypeError('memory.' + key + ' must be a finite non-negative number')
  }
  const p = root.persona === undefined ? {} : record(root.persona, 'persona')
  for (const key of Object.keys(p)) if (!['enabled', 'displayName', 'tone', 'animeExpression'].includes(key)) throw new TypeError('Unknown persona field: ' + key)
  if (p.enabled !== undefined && p.enabled !== false) throw new TypeError('persona.enabled must remain false: Host prompt integration is unverified')
  if (p.displayName !== undefined && (typeof p.displayName !== 'string' || !p.displayName.trim() || p.displayName.length > 80)) throw new TypeError('persona.displayName must contain 1–80 characters')
  if (p.tone !== undefined && p.tone !== 'friend' && p.tone !== 'companion') throw new TypeError('persona.tone must be friend or companion')
  if (p.animeExpression !== undefined && typeof p.animeExpression !== 'boolean') throw new TypeError('persona.animeExpression must be boolean')
  return {
    memory: resolveMemoryConfig({ memory }),
    persona: Object.freeze({
      enabled: false,
      displayName: typeof p.displayName === 'string' ? p.displayName.trim() : 'Everlasting Ally',
      tone: p.tone === 'companion' ? 'companion' : 'friend',
      animeExpression: p.animeExpression === true,
    }),
  }
}
