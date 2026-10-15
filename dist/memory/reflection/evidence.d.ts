import type { MemoryEvent } from '../types.js';
export type EvidenceChain = {
    events: MemoryEvent[];
    userEvents: MemoryEvent[];
    assistantEvents: MemoryEvent[];
    toolCalls: MemoryEvent[];
    toolResults: MemoryEvent[];
    failures: MemoryEvent[];
    corrections: MemoryEvent[];
    confirmedSuccesses: MemoryEvent[];
};
export declare function buildEvidenceChain(events: MemoryEvent[]): EvidenceChain;
export declare function eventText(event: MemoryEvent): string;
