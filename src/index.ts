/** Minimal Everlasting Ally host facet. */
import { MemoryCapture } from './memory/capture.js'
import { resolveMemoryConfig } from './memory/config.js'
import { MemoryStorage, type MemoryStats } from './memory/storage.js'
import type { SessionEventLike, SessionLike } from './memory/types.js'

type ToolResult = { ok: true; plugin: 'everlasting-ally'; message: string }
type StatusResult = Omit<MemoryStats, 'lastSuccessfulWriteAt'> & { lastSuccessfulWriteAt: string }
type ToolContext = {
  tools: {
    register(definition: {
      name: string
      description: string
      parameters: Record<string, unknown>
      output: {
        schema: Record<string, unknown>
        render(args: unknown, value: unknown): Array<Record<string, unknown>>
      }
      execute(args: unknown): Promise<unknown>
    }): () => void
  }
  effect(setup: () => (() => void) | void, label?: string): void
}
type HostContext = {
  inject(services: string[], callback: (context: ToolContext) => void): void
  on?: (event: string, listener: (session: SessionLike, event: SessionEventLike) => void) => (() => void) | void
  effect?: (setup: () => (() => void) | void, label?: string) => void
}
const TOOL_NAME = 'inside_memory_ping'

function normalizeMessage(args: unknown): string {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) return 'Everlasting Ally is loaded.'
  const message = (args as { message?: unknown }).message
  return typeof message === 'string' && message.trim() ? message.trim() : 'Everlasting Ally is loaded.'
}

export const name = 'everlasting-ally'

export type MemoryRuntime = {
  capture: MemoryCapture
  storage: MemoryStorage | null
}

export function mountMemoryRuntime(root: HostContext, rawConfig?: unknown): MemoryRuntime {
  const config = resolveMemoryConfig(rawConfig)
  let storage: MemoryStorage | null = null
  try {
    storage = new MemoryStorage(config)
  } catch {
    storage = null
  }
  const capture = new MemoryCapture((event) => {
    storage?.saveEvent(event)
  })
  if (typeof root.on !== 'function') return { capture, storage }
  const dispose = root.on('session/event', (session, event) => {
    capture.handleSessionEvent(session, event)
  })
  if (typeof dispose === 'function' && typeof root.effect === 'function') {
    root.effect(() => dispose, 'everlasting-ally: session event listener')
  }
  if (storage && typeof root.effect === 'function') {
    root.effect(() => () => storage?.close(), 'everlasting-ally: memory database')
  }
  return { capture, storage }
}

export function mountMemoryCapture(root: HostContext, rawConfig?: unknown): MemoryCapture {
  return mountMemoryRuntime(root, rawConfig).capture
}

export function apply(root: HostContext, rawConfig?: unknown): void {
  const runtime = mountMemoryRuntime(root, rawConfig)
  root.inject(['tools'], (ctx) => {
    const unregister = ctx.tools.register({
      name: TOOL_NAME,
      description: 'Confirm that the Everlasting Ally plugin is loaded and its tool surface is available.',
      parameters: {
        type: 'object',
        properties: { message: { type: 'string', description: 'Optional message to echo in the health response.' } },
        additionalProperties: false
      },
      output: {
        schema: {
          type: 'object',
          properties: { ok: { type: 'boolean' }, plugin: { type: 'string' }, message: { type: 'string' } },
          required: ['ok', 'plugin', 'message'], additionalProperties: false
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }]
      },
      execute: async (args): Promise<ToolResult> => ({
        ok: true, plugin: 'everlasting-ally', message: normalizeMessage(args)
      })
    })
    ctx.effect(() => unregister, 'everlasting-ally: tool registration')
    const statusUnregister = ctx.tools.register({
      name: 'inside_memory_status',
      description: 'Return memory capture status and aggregate counts without returning event content.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      output: {
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' }, databaseStatus: { type: 'string' },
            eventCount: { type: 'integer' }, sessionCount: { type: 'integer' },
            lastSuccessfulWriteAt: { type: 'string' },
          },
          required: ['enabled', 'databaseStatus', 'eventCount', 'sessionCount', 'lastSuccessfulWriteAt'],
          additionalProperties: false,
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: async (): Promise<StatusResult> => {
        const stats = runtime.storage?.getMemoryStats()
        return {
          enabled: stats?.enabled ?? resolveMemoryConfig(rawConfig).enabled,
          databaseStatus: stats?.databaseStatus ?? 'unavailable',
          eventCount: stats?.eventCount ?? 0,
          sessionCount: stats?.sessionCount ?? 0,
          lastSuccessfulWriteAt: stats?.lastSuccessfulWriteAt ?? '',
        }
      },
    })
    ctx.effect(() => statusUnregister, 'everlasting-ally: status tool registration')
  })
}
export { TOOL_NAME }
