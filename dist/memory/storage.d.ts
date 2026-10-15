import type { MemoryConfig } from './config.js';
import type { MemoryEvent } from './types.js';
export type MemoryStats = {
    pluginVersion: string;
    enabled: boolean;
    databaseStatus: 'ready' | 'disabled' | 'unavailable' | 'closed';
    eventCount: number;
    sessionCount: number;
    lastSuccessfulWriteAt: string | null;
};
export type SaveEventResult = {
    saved: boolean;
    reason?: 'disabled' | 'filtered' | 'too_large' | 'unavailable' | 'closed' | 'duplicate';
};
export declare const PLUGIN_VERSION = "0.3.0";
export declare class MemoryStorage {
    readonly config: MemoryConfig;
    private db;
    private lastError;
    private lastSuccessfulWriteAt;
    constructor(config: MemoryConfig);
    get available(): boolean;
    saveEvent(event: MemoryEvent): SaveEventResult;
    getEvent(id: string): MemoryEvent | null;
    listSessionEvents(sessionId: string): MemoryEvent[];
    listRecentEvents(limit?: number): MemoryEvent[];
    deleteSession(sessionId: string): boolean;
    clearAllMemories(): boolean;
    getMemoryStats(): MemoryStats;
    close(): void;
}
