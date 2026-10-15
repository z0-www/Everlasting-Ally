import type { MemoryStorage } from '../storage.js';
import type { ConsolidationOptions } from './consolidation.js';
import type { ReflectionBudget, ReflectionRecord } from './types.js';
export declare class ReflectionService {
    private readonly storage;
    private readonly budget;
    constructor(storage: MemoryStorage, budget: ReflectionBudget);
    reflectSession(sessionId: string, options?: ConsolidationOptions): ReflectionRecord[];
    consolidateMemories(options?: ConsolidationOptions): ReflectionRecord[];
    listReflections(options?: {
        sessionId?: string;
        type?: ReflectionRecord['reflectionType'];
        limit?: number;
    }): ReflectionRecord[];
    getReflection(id: string): ReflectionRecord | null;
}
