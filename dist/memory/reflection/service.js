import { consolidateSession } from './consolidation.js';
export class ReflectionService {
    storage;
    budget;
    constructor(storage, budget) {
        this.storage = storage;
        this.budget = budget;
    }
    reflectSession(sessionId, options = {}) {
        if (!this.budget.reflectionEnabled)
            return [];
        const events = this.storage.listSessionEvents(sessionId).slice(0, this.budget.maxReflectionEvents);
        const orbs = events.flatMap((event) => this.storage.listOrbsForEvent(event.id));
        const records = consolidateSession(events, orbs, {
            maxEvents: Math.min(options.maxEvents ?? this.budget.maxReflectionEvents, this.budget.maxReflectionEvents),
            maxInputChars: Math.min(options.maxInputChars ?? this.budget.maxInputChars, this.budget.maxInputChars),
        });
        for (const reflection of records)
            this.storage.saveReflection(reflection);
        return records;
    }
    consolidateMemories(options = {}) {
        if (!this.budget.reflectionEnabled)
            return [];
        const events = this.storage.listRecentEvents(this.budget.maxReflectionEvents);
        const bySession = new Map();
        for (const event of events)
            bySession.set(event.sessionId, [...(bySession.get(event.sessionId) ?? []), event]);
        return [...bySession.keys()].flatMap((sessionId) => this.reflectSession(sessionId, options));
    }
    listReflections(options = {}) {
        if (!this.budget.reflectionEnabled)
            return [];
        return this.storage.listReflections(options);
    }
    getReflection(id) {
        if (!this.budget.reflectionEnabled)
            return null;
        return this.storage.getReflection(id);
    }
}
