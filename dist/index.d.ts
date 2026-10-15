/** Minimal Everlasting Ally host facet. */
type ToolResult = {
    ok: true;
    plugin: 'everlasting-ally';
    message: string;
};
type ToolContext = {
    tools: {
        register(definition: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
            output: {
                schema: Record<string, unknown>;
                render(args: unknown, value: ToolResult): Array<Record<string, unknown>>;
            };
            execute(args: unknown): Promise<ToolResult>;
        }): () => void;
    };
    effect(setup: () => (() => void) | void, label?: string): void;
};
type HostContext = {
    inject(services: string[], callback: (context: ToolContext) => void): void;
};
declare const TOOL_NAME = "inside_memory_ping";
export declare const name = "everlasting-ally";
export declare function apply(root: HostContext): void;
export { TOOL_NAME };
