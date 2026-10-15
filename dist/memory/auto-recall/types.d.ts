import type { MemoryEvent } from '../types.js';
import type { RecallResult } from '../recall/types.js';
export type AutoRecallConfig = {
    enabled: boolean;
    maxResults: number;
    maxChars: number;
    minScore: number;
    timeoutMs: number;
};
export type AutoRecallResult = {
    injected: boolean;
    reason: 'disabled' | 'no_reliable_memory' | 'hook_unavailable' | 'timeout' | 'scope_denied' | 'hook_used';
    recall: RecallResult | null;
};
export type ContextExtension = {
    inject(context: string, evidenceEventIds: string[]): Promise<boolean> | boolean;
};
export type AutoRecallInput = {
    event: MemoryEvent;
    scopeId?: string;
};
