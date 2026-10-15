/** Minimal Everlasting Ally host facet. */
import { MemoryCapture } from './memory/capture.js';
import { resolveMemoryConfig } from './memory/config.js';
import { MemoryStorage } from './memory/storage.js';
import { MemoryOrbService } from './memory/orb/service.js';
const TOOL_NAME = 'inside_memory_ping';
function normalizeMessage(args) {
    if (typeof args !== 'object' || args === null || Array.isArray(args))
        return 'Everlasting Ally is loaded.';
    const message = args.message;
    return typeof message === 'string' && message.trim() ? message.trim() : 'Everlasting Ally is loaded.';
}
export const name = 'everlasting-ally';
export function mountMemoryRuntime(root, rawConfig) {
    const config = resolveMemoryConfig(rawConfig);
    let storage = null;
    try {
        storage = new MemoryStorage(config);
    }
    catch {
        storage = null;
    }
    const orbService = storage ? new MemoryOrbService(storage) : null;
    const capture = new MemoryCapture((event) => {
        const result = storage?.saveEvent(event);
        if (result?.saved)
            orbService?.enqueue(event);
    });
    if (typeof root.on !== 'function')
        return { capture, storage, orbService };
    const dispose = root.on('session/event', (session, event) => {
        capture.handleSessionEvent(session, event);
    });
    if (typeof dispose === 'function' && typeof root.effect === 'function') {
        root.effect(() => dispose, 'everlasting-ally: session event listener');
    }
    if (orbService && typeof root.effect === 'function') {
        root.effect(() => () => orbService.close(), 'everlasting-ally: memory orb queue');
    }
    if (storage && typeof root.effect === 'function') {
        root.effect(() => () => storage?.close(), 'everlasting-ally: memory database');
    }
    return { capture, storage, orbService };
}
export function mountMemoryCapture(root, rawConfig) {
    return mountMemoryRuntime(root, rawConfig).capture;
}
export function apply(root, rawConfig) {
    const runtime = mountMemoryRuntime(root, rawConfig);
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
            execute: async (args) => ({
                ok: true, plugin: 'everlasting-ally', message: normalizeMessage(args)
            })
        });
        ctx.effect(() => unregister, 'everlasting-ally: tool registration');
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
                    required: ['enabled', 'databaseStatus', 'eventCount', 'sessionCount', 'lastSuccessfulWriteAt'],
                    additionalProperties: false,
                },
                render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
            },
            execute: async () => {
                const stats = runtime.storage?.getMemoryStats();
                return {
                    pluginVersion: stats?.pluginVersion ?? '0.4.0',
                    enabled: stats?.enabled ?? resolveMemoryConfig(rawConfig).enabled,
                    databaseStatus: stats?.databaseStatus ?? 'unavailable',
                    eventCount: stats?.eventCount ?? 0,
                    sessionCount: stats?.sessionCount ?? 0,
                    lastSuccessfulWriteAt: stats?.lastSuccessfulWriteAt ?? '',
                };
            },
        });
        ctx.effect(() => statusUnregister, 'everlasting-ally: status tool registration');
    });
}
export { TOOL_NAME };
