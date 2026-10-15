import type { MemoryEvent } from '../types.js';
import type { MemoryOrb } from '../orb/types.js';
import type { ReflectionRecord } from './types.js';
export type ConsolidationOptions = {
    maxEvents?: number;
    maxInputChars?: number;
};
export declare function consolidateSession(events: MemoryEvent[], orbs: MemoryOrb[], options?: ConsolidationOptions): ReflectionRecord[];
