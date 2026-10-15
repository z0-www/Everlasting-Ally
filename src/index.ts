/** Minimal Everlasting Ally host facet. */
import { MemoryCapture } from './memory/capture.js'
import type { SessionEventLike, SessionLike } from './memory/types.js'

type ToolResult = { ok: true; plugin: 'everlasting-ally'; message: string }
type ToolContext = {
  tools: {
    register(definition: {
      name: string
      description: string
      parameters: Record<string, unknown>
      output: {
        schema: Record<string, unknown>
        render(args: unknown, value: ToolResult): Array<Record<string, unknown>>
      }
      execute(args: unknown): Promise<ToolResult>
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

export function mountMemoryCapture(root: HostContext): MemoryCapture {
  const capture = new MemoryCapture()
  if (typeof root.on !== 'function') return capture
  const dispose = root.on('session/event', (session, event) => {
    capture.handleSessionEvent(session, event)
  })
  if (typeof dispose === 'function' && typeof root.effect === 'function') {
    root.effect(() => dispose, 'everlasting-ally: session event listener')
  }
  return capture
}

export function apply(root: HostContext): void {
  mountMemoryCapture(root)
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
  })
}
export { TOOL_NAME }
