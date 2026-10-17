/** Minimal Everlasting Ally host facet. */
import { MemoryCapture } from './memory/capture.js'
import { resolveMemoryConfig } from './memory/config.js'
import { MemoryStorage, type MemoryStats } from './memory/storage.js'
import { MemoryOrbService } from './memory/orb/service.js'
import { MemoryRecallService } from './memory/recall/service.js'
import { ReflectionService } from './memory/reflection/service.js'
import type { ReflectionBudget } from './memory/reflection/types.js'
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
  orbService: MemoryOrbService | null
  reflectionService: ReflectionService | null
}

export function mountMemoryRuntime(root: HostContext, rawConfig?: unknown): MemoryRuntime {
  const config = resolveMemoryConfig(rawConfig)
  let storage: MemoryStorage | null = null
  try {
    storage = new MemoryStorage(config)
  } catch {
    storage = null
  }
  const orbService = storage ? new MemoryOrbService(storage) : null
  const reflectionBudget: ReflectionBudget = {
    reflectionEnabled: config.reflectionEnabled,
    modelReflectionEnabled: config.modelReflectionEnabled,
    maxReflectionEvents: config.maxReflectionEvents,
    maxInputChars: config.maxInputChars,
    maxOutputChars: config.maxOutputChars,
    maxModelCalls: config.maxModelCalls,
    maxTokensPerRun: config.maxTokensPerRun,
    reflectionTimeoutMs: config.reflectionTimeoutMs,
  }
  const reflectionService = storage ? new ReflectionService(storage, reflectionBudget) : null
  const capture = new MemoryCapture((event) => {
    const result = storage?.saveEvent(event)
    if (result?.saved && result.storedEvent) orbService?.enqueue(result.storedEvent)
  })
  if (typeof root.on !== 'function') return { capture, storage, orbService, reflectionService }
  const dispose = root.on('session/event', (session, event) => {
    capture.handleSessionEvent(session, event)
  })
  if (typeof dispose === 'function' && typeof root.effect === 'function') {
    root.effect(() => dispose, 'everlasting-ally: session event listener')
  }
  if (orbService && typeof root.effect === 'function') {
    root.effect(() => () => orbService.close(), 'everlasting-ally: memory orb queue')
  }
  if (storage && typeof root.effect === 'function') {
    root.effect(() => () => storage?.close(), 'everlasting-ally: memory database')
  }
  return { capture, storage, orbService, reflectionService }
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
            pluginVersion: { type: 'string' }, enabled: { type: 'boolean' }, databaseStatus: { type: 'string' },
            eventCount: { type: 'integer' }, sessionCount: { type: 'integer' },
            lastSuccessfulWriteAt: { type: 'string' },
          },
          required: ['pluginVersion', 'enabled', 'databaseStatus', 'eventCount', 'sessionCount', 'lastSuccessfulWriteAt'],
          additionalProperties: false,
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: async (): Promise<StatusResult> => {
        const stats = runtime.storage?.getMemoryStats()
        return {
          pluginVersion: stats?.pluginVersion ?? '1.0.0-rc.2',
          enabled: stats?.enabled ?? resolveMemoryConfig(rawConfig).enabled,
          databaseStatus: stats?.databaseStatus ?? 'unavailable',
          eventCount: stats?.eventCount ?? 0,
          sessionCount: stats?.sessionCount ?? 0,
          lastSuccessfulWriteAt: stats?.lastSuccessfulWriteAt ?? '',
        }
      },
    })
    ctx.effect(() => statusUnregister, 'everlasting-ally: status tool registration')
    const recallUnregister = ctx.tools.register({
      name: 'inside_memory_recall',
      description: 'Search enabled local memories and return only evidence-backed historical context.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          maxResults: { type: 'integer', minimum: 1, maximum: 10 },
          maxChars: { type: 'integer', minimum: 100, maximum: 4000 },
        },
        required: ['query'],
        additionalProperties: false,
      },
      output: {
        schema: {
          type: 'object',
          properties: { found: { type: 'boolean' }, summary: { type: 'string' }, evidenceEventIds: { type: 'array' } },
          required: ['found', 'summary', 'evidenceEventIds'],
          additionalProperties: false,
        },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: async (args): Promise<Record<string, unknown>> => {
        const input = typeof args === 'object' && args !== null ? args as Record<string, unknown> : {}
        const query = typeof input.query === 'string' ? input.query : ''
        if (!runtime.storage || !runtime.storage.config.recallEnabled) {
          return { found: false, summary: '未找到足够可靠的记忆。记忆检索未启用。', evidenceEventIds: [] }
        }
        const recall = new MemoryRecallService(runtime.storage)
        const result = recall.search(query, {
          maxResults: typeof input.maxResults === 'number' ? input.maxResults : 5,
          maxChars: typeof input.maxChars === 'number' ? input.maxChars : 2000,
        })
        return { found: result.found, summary: result.summary, evidenceEventIds: result.evidenceEventIds }
      },
    })
    ctx.effect(() => recallUnregister, 'everlasting-ally: recall tool registration')
    const reflectionUnregister = ctx.tools.register({
      name: 'inside_memory_reflections',
      description: 'Read existing evidence-backed reflection summaries without creating new reflections.',
      parameters: {
        type: 'object',
        properties: { sessionId: { type: 'string' }, type: { type: 'string' }, limit: { type: 'integer' } },
        additionalProperties: false,
      },
      output: {
        schema: { type: 'object', properties: { reflections: { type: 'array' } }, required: ['reflections'], additionalProperties: false },
        render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
      },
      execute: async (args): Promise<Record<string, unknown>> => {
        if (!runtime.reflectionService) return { reflections: [] }
        const input = typeof args === 'object' && args !== null ? args as Record<string, unknown> : {}
        const options: { sessionId?: string; type?: never; limit: number } = { limit: typeof input.limit === 'number' ? input.limit : 20 }
        if (typeof input.sessionId === 'string') options.sessionId = input.sessionId
        return { reflections: runtime.reflectionService.listReflections(options) }
      },
    })
    ctx.effect(() => reflectionUnregister, 'everlasting-ally: reflections tool registration')
  })
}
export { TOOL_NAME }
