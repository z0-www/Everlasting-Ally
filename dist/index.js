const TOOL_NAME = 'inside_memory_ping';
function normalizeMessage(args) {
    if (typeof args !== 'object' || args === null || Array.isArray(args))
        return 'Everlasting Ally is loaded.';
    const message = args.message;
    return typeof message === 'string' && message.trim() ? message.trim() : 'Everlasting Ally is loaded.';
}
export const name = 'everlasting-ally';
export function apply(root) {
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
    });
}
export { TOOL_NAME };
