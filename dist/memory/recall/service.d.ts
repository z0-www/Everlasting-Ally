import type { MemoryStorage } from '../storage.js';
import type { RecallOptions, RecallResult } from './types.js';
export declare class MemoryRecallService {
    private readonly storage;
    constructor(storage: MemoryStorage);
    search(query: string, options?: RecallOptions): RecallResult;
}
