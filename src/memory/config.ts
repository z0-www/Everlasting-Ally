import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type MemoryConfig = {
  enabled: boolean
  captureUserMessages: boolean
  captureAssistantMessages: boolean
  captureToolEvents: boolean
  analysisEnabled: boolean
  maxEventBytes: number
  retentionDays: number
  databasePath: string
}

const DEFAULT_MAX_EVENT_BYTES = 64 * 1024

function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}
function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback
}
export function defaultDatabasePath(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  const base = env.APPDATA ?? env.XDG_DATA_HOME ?? (env.HOME ? join(env.HOME, '.local', 'share') : join(tmpdir(), 'everlasting-ally'))
  return join(base, 'everlasting-ally', 'memory.sqlite')
}
export function resolveMemoryConfig(rawConfig?: unknown): MemoryConfig {
  const root = objectValue(rawConfig)
  const memory = objectValue(root.memory ?? rawConfig)
  return {
    enabled: booleanValue(memory.enabled, false),
    captureUserMessages: booleanValue(memory.captureUserMessages, true),
    captureAssistantMessages: booleanValue(memory.captureAssistantMessages, true),
    captureToolEvents: booleanValue(memory.captureToolEvents, true),
    analysisEnabled: booleanValue(memory.analysisEnabled, false),
    maxEventBytes: positiveInteger(memory.maxEventBytes, DEFAULT_MAX_EVENT_BYTES),
    retentionDays: typeof memory.retentionDays === 'number' && Number.isInteger(memory.retentionDays) && memory.retentionDays >= 0
      ? memory.retentionDays : 0,
    databasePath: typeof memory.databasePath === 'string' && memory.databasePath.trim()
      ? memory.databasePath : defaultDatabasePath(),
  }
}
export function defaultMemoryConfig(): MemoryConfig {
  return resolveMemoryConfig()
}
