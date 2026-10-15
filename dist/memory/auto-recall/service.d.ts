import type { MemoryRecallService } from '../recall/service.js';
import type { AutoRecallConfig, AutoRecallInput, AutoRecallResult, ContextExtension } from './types.js';
export declare class AutoRecallService {
    private readonly recall;
    private readonly config;
    private readonly extension?;
    constructor(recall: MemoryRecallService, config: AutoRecallConfig, extension?: ContextExtension | undefined);
    process(input: AutoRecallInput): Promise<AutoRecallResult>;
}
