/** Minimal Everlasting Ally host facet. */
import { MemoryCapture } from './memory/capture.js';
import { MemoryStorage } from './memory/storage.js';
import type { SessionEventLike, SessionLike } from './memory/types.js';
type ToolContext = {
    tools: {
        register(definition: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
            output: {
                schema: Record<string, unknown>;
                render(args: unknown, value: unknown): Array<Record<string, unknown>>;
            };
            execute(args: unknown): Promise<unknown>;
        }): () => void;
    };
    effect(setup: () => (() => void) | void, label?: string): void;
};
type HostContext = {
    inject(services: string[], callback: (context: ToolContext) => void): void;
    on?: (event: string, listener: (session: SessionLike, event: SessionEventLike) => void) => (() => void) | void;
    effect?: (setup: () => (() => void) | void, label?: string) => void;
};
declare const TOOL_NAME = "inside_memory_ping";
export declare const name = "everlasting-ally";
export type MemoryRuntime = {
    capture: MemoryCapture;
    storage: MemoryStorage | null;
};
export declare function mountMemoryRuntime(root: HostContext, rawConfig?: unknown): MemoryRuntime;
export declare function mountMemoryCapture(root: HostContext, rawConfig?: unknown): MemoryCapture;
export declare function apply(root: HostContext, rawConfig?: unknown): void;
export { TOOL_NAME };
