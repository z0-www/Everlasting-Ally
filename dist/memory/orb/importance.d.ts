import type { MemoryEvent } from '../types.js';
export type ImportanceScore = {
    score: number;
    reasons: string[];
    coreMemoryCandidate: boolean;
};
export declare function scoreImportance(event: MemoryEvent): ImportanceScore;
