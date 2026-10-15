import type { ReflectionAnalyzer, ReflectionInput, ReflectionRecord } from './types.js';
export declare const LOCAL_REFLECTION_VERSION = "local-reflection-1";
export declare class LocalReflectionAnalyzer implements ReflectionAnalyzer {
    private readonly now;
    constructor(now?: () => string);
    analyze(input: ReflectionInput): ReflectionRecord[];
}
export type ReflectionProvider = {
    readonly name: string;
    analyze(input: ReflectionInput, signal?: AbortSignal): Promise<ReflectionRecord[]>;
};
export declare function createUnavailableReflectionProvider(): ReflectionProvider;
