import type { MemoryConfig } from './config.js';
import type { MemoryEvent } from './types.js';
import type { MemoryOrb } from './orb/types.js';
import type { ReflectionRecord } from './reflection/types.js';
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
    storedEvent?: MemoryEvent;
    reason?: 'disabled' | 'filtered' | 'too_large' | 'unavailable' | 'closed' | 'duplicate';
};
export type SaveOrbResult = {
    saved: boolean;
    reason?: 'disabled' | 'analysis_disabled' | 'unavailable' | 'closed' | 'duplicate';
};
export type SaveReflectionResult = {
    saved: boolean;
    reason?: 'disabled' | 'reflection_disabled' | 'unavailable' | 'closed' | 'duplicate';
};
export declare const PLUGIN_VERSION = "0.6.1";
export declare class MemoryStorage {
    readonly config: MemoryConfig;
    private db;
    private lastError;
    private lastSuccessfulWriteAt;
    constructor(config: MemoryConfig);
    get available(): boolean;
    prepareEvent(event: MemoryEvent): MemoryEvent | null;
    saveEvent(event: MemoryEvent): SaveEventResult;
    getEvent(id: string): MemoryEvent | null;
    deleteEvent(id: string): boolean;
    listSessionEvents(sessionId: string): MemoryEvent[];
    listRecentEvents(limit?: number): MemoryEvent[];
    saveOrb(orb: MemoryOrb): SaveOrbResult;
    getOrb(id: string): MemoryOrb | null;
    listOrbsForEvent(eventId: string): MemoryOrb[];
    listSessionOrbs(sessionId: string): MemoryOrb[];
    listRecentOrbs(limit?: number): MemoryOrb[];
    listOrbsByEmotion(emotion: string): MemoryOrb[];
    listCoreMemoryCandidates(limit?: number): MemoryOrb[];
    updateOrb(orb: MemoryOrb): boolean;
    deleteOrb(id: string): boolean;
    saveReflection(reflection: ReflectionRecord): SaveReflectionResult;
    getReflection(id: string): ReflectionRecord | null;
    listReflections(options?: {
        sessionId?: string;
        type?: ReflectionRecord['reflectionType'];
        limit?: number;
    }): ReflectionRecord[];
    updateReflection(reflection: ReflectionRecord): boolean;
    deleteReflection(id: string): boolean;
    deleteSession(sessionId: string): boolean;
    clearAllMemories(): boolean;
    getMemoryStats(): MemoryStats;
    close(): void;
}
