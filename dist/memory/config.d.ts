export type MemoryConfig = {
    enabled: boolean;
    captureUserMessages: boolean;
    captureAssistantMessages: boolean;
    captureToolEvents: boolean;
    analysisEnabled: boolean;
    maxEventBytes: number;
    retentionDays: number;
    databasePath: string;
};
export declare function defaultDatabasePath(): string;
export declare function resolveMemoryConfig(rawConfig?: unknown): MemoryConfig;
export declare function defaultMemoryConfig(): MemoryConfig;
