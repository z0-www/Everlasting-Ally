import { tmpdir } from 'node:os';
import { join } from 'node:path';
const DEFAULT_MAX_EVENT_BYTES = 64 * 1024;
function objectValue(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {};
}
function booleanValue(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function positiveInteger(value, fallback) {
    return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
}
export function defaultDatabasePath() {
    const env = globalThis.process?.env ?? {};
    const base = env.APPDATA ?? env.XDG_DATA_HOME ?? (env.HOME ? join(env.HOME, '.local', 'share') : join(tmpdir(), 'everlasting-ally'));
    return join(base, 'everlasting-ally', 'memory.sqlite');
}
export function resolveMemoryConfig(rawConfig) {
    const root = objectValue(rawConfig);
    const memory = objectValue(root.memory ?? rawConfig);
    return {
        enabled: booleanValue(memory.enabled, false),
        captureUserMessages: booleanValue(memory.captureUserMessages, true),
        captureAssistantMessages: booleanValue(memory.captureAssistantMessages, true),
        captureToolEvents: booleanValue(memory.captureToolEvents, true),
        analysisEnabled: booleanValue(memory.analysisEnabled, false),
        recallEnabled: booleanValue(memory.recallEnabled, false),
        reflectionEnabled: booleanValue(memory.reflectionEnabled, false),
        modelReflectionEnabled: booleanValue(memory.modelReflectionEnabled, false),
        maxReflectionEvents: positiveInteger(memory.maxReflectionEvents, 100),
        maxInputChars: positiveInteger(memory.maxInputChars, 16000),
        maxOutputChars: positiveInteger(memory.maxOutputChars, 4000),
        maxModelCalls: positiveInteger(memory.maxModelCalls, 0),
        maxTokensPerRun: positiveInteger(memory.maxTokensPerRun, 0),
        reflectionTimeoutMs: positiveInteger(memory.reflectionTimeoutMs, 5000),
        autoRecallEnabled: booleanValue(memory.autoRecallEnabled, false),
        autoRecallMaxResults: positiveInteger(memory.autoRecallMaxResults, 3),
        autoRecallMaxChars: positiveInteger(memory.autoRecallMaxChars, 1200),
        autoRecallMinScore: typeof memory.autoRecallMinScore === 'number' && memory.autoRecallMinScore >= 0
            ? Math.min(1, memory.autoRecallMinScore) : 0.18,
        autoRecallTimeoutMs: positiveInteger(memory.autoRecallTimeoutMs, 500),
        scopeId: typeof memory.scopeId === 'string' && memory.scopeId.trim() ? memory.scopeId : 'local-user',
        maxEventBytes: positiveInteger(memory.maxEventBytes, DEFAULT_MAX_EVENT_BYTES),
        retentionDays: typeof memory.retentionDays === 'number' && Number.isInteger(memory.retentionDays) && memory.retentionDays >= 0
            ? memory.retentionDays : 0,
        databasePath: typeof memory.databasePath === 'string' && memory.databasePath.trim()
            ? memory.databasePath : defaultDatabasePath(),
    };
}
export function defaultMemoryConfig() {
    return resolveMemoryConfig();
}
