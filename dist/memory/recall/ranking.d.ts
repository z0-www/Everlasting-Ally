import type { MemoryOrb } from '../orb/types.js';
import type { MemoryEvent } from '../types.js';
import type { RecallCandidate } from './types.js';
export declare function rankCandidate(event: MemoryEvent, orb: MemoryOrb | null, tokens: string[], reflection?: RecallCandidate['reflection']): RecallCandidate;
export declare function rankCandidates(candidates: RecallCandidate[]): RecallCandidate[];
