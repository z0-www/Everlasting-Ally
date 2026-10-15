import type { MemoryEvent } from '../types.js';
import type { OrbAnalysis, OrbAnalyzer } from './types.js';
export declare const LOCAL_ANALYSIS_VERSION = "local-rules-1";
export declare class LocalRuleAnalyzer implements OrbAnalyzer {
    analyze(event: MemoryEvent): OrbAnalysis;
}
export type AnalysisProvider = {
    readonly name: string;
    analyze(event: MemoryEvent, signal?: AbortSignal): Promise<OrbAnalysis>;
};
export declare function createUnavailableModelProvider(): AnalysisProvider;
