import type { MemoryStorage } from '../storage.js';
import type { RecallCandidate } from './types.js';
export declare function searchStoredMemories(storage: MemoryStorage, query: string, maxScan?: number): RecallCandidate[];
