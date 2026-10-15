const EVENT_SPECS = {
    'user/message': { actor: 'user', eventType: 'user_message', contentKeys: ['message', 'content', 'text'] },
    'assistant/message': {
        actor: 'assistant',
        eventType: 'assistant_message',
        candidateType: 'assistant_response',
        contentKeys: ['message', 'content', 'text'],
    },
    'tool/call': {
        actor: 'tool',
        eventType: 'tool_call',
        candidateType: 'tool_execution',
        contentKeys: ['arguments', 'args', 'content'],
    },
    'tool/result': { actor: 'tool', eventType: 'tool_result', contentKeys: ['result', 'content', 'text', 'error'] },
    'turn/end': { actor: 'system', eventType: 'turn_end', contentKeys: ['content', 'text'] },
};
function stringValue(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function sessionIdOf(session) {
    return stringValue(session.id) ?? stringValue(session.sessionId)
        ?? stringValue(session.header?.id) ?? stringValue(session.header?.sessionId);
}
function numberValue(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function jsonValue(value) {
    if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        return value;
    if (Array.isArray(value)) {
        const values = value.map(jsonValue);
        return values.every((item, index) => item !== null || value[index] === null) ? values : null;
    }
    if (typeof value !== 'object')
        return null;
    const result = {};
    for (const [key, item] of Object.entries(value)) {
        const converted = jsonValue(item);
        if (converted !== null || item === null)
            result[key] = converted;
    }
    return result;
}
function contentOf(event, keys) {
    for (const key of keys) {
        const value = jsonValue(event[key]);
        if (value !== null)
            return value;
    }
    return null;
}
function eventId(event, source, index) {
    return stringValue(event.id) ?? source.sessionId + ':' + (source.eventSeq ?? 'unknown-' + index) + ':' + source.eventName;
}
function sourceOf(session, event, now) {
    const sessionId = sessionIdOf(session);
    const eventName = stringValue(event.type);
    if (!sessionId || !eventName)
        return null;
    return {
        kind: 'dsh_session_event',
        eventName,
        sessionId,
        eventSeq: numberValue(event.seq) ?? numberValue(event.eventSeq) ?? numberValue(event.sequence),
        timestamp: stringValue(event.time) ?? stringValue(event.timestamp) ?? now,
    };
}
function sourceRoleMatches(event, actor) {
    const role = stringValue(event.role);
    return role === null || role === actor;
}
export class MemoryCapture {
    onCaptured;
    clock;
    onError;
    calls = new Map();
    capturedEvents = [];
    sequence = 0;
    maxRetainedEvents;
    constructor(onCaptured, clock = () => new Date().toISOString(), onError, options = {}) {
        this.onCaptured = onCaptured;
        this.clock = clock;
        this.onError = onError;
        this.maxRetainedEvents = Math.max(0, options.maxRetainedEvents ?? 256);
    }
    capture(session, rawEvent) {
        const now = this.clock();
        const source = sourceOf(session, rawEvent, now);
        if (!source)
            return null;
        const spec = EVENT_SPECS[source.eventName];
        if (!spec || !sourceRoleMatches(rawEvent, spec.actor))
            return null;
        const content = contentOf(rawEvent, spec.contentKeys);
        const callId = stringValue(rawEvent.callId) ?? stringValue(rawEvent.toolCallId);
        const relatedEventIds = callId && spec.eventType === 'tool_result' && this.calls.has(source.sessionId + ':' + callId)
            ? [this.calls.get(source.sessionId + ':' + callId)] : [];
        const event = {
            id: eventId(rawEvent, source, this.sequence++),
            sessionId: source.sessionId,
            eventSeq: source.eventSeq,
            timestamp: source.timestamp,
            actor: spec.actor,
            eventType: spec.eventType,
            content,
            source,
            callId,
            relatedEventIds,
            captureStatus: content === null && spec.eventType !== 'turn_end' ? 'partial' : 'captured',
            createdAt: now,
            ...(spec.candidateType ? { candidateType: spec.candidateType } : {}),
            emotions: null,
            meaning: null,
            importance: null,
            confidence: null,
            memoryType: null,
            relatedMemories: null,
        };
        if (spec.eventType === 'tool_call' && callId)
            this.calls.set(source.sessionId + ':' + callId, event.id);
        if (this.maxRetainedEvents > 0) {
            this.capturedEvents.push(event);
            if (this.capturedEvents.length > this.maxRetainedEvents)
                this.capturedEvents.splice(0, this.capturedEvents.length - this.maxRetainedEvents);
        }
        try {
            this.onCaptured?.(event);
        }
        catch (error) {
            this.onError?.(error);
        }
        return event;
    }
    handleSessionEvent(session, event) {
        return this.capture(session, event);
    }
    get events() {
        return this.capturedEvents;
    }
}
