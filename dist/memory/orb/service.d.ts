import type { MemoryEvent } from '../types.js';
import type { MemoryStorage } from '../storage.js';
import type { OrbAnalyzer } from './types.js';
export type OrbServiceOptions = {
    maxQueue?: number;
    now?: () => string;
};
export declare class MemoryOrbService {
    private readonly storage;
    private readonly analyzer;
    private readonly queue;
    private draining;
    private closed;
    private readonly maxQueue;
    private readonly now;
    constructor(storage: MemoryStorage, analyzer?: OrbAnalyzer, options?: OrbServiceOptions);
    enqueue(event: MemoryEvent): boolean;
    private schedule;
    private drain;
    flush(): Promise<void>;
    close(): void;
    get queuedCount(): number;
}
