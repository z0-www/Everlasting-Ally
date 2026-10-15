import { scoreImportance } from './importance.js';
import { LOCAL_ANALYSIS_VERSION, LocalRuleAnalyzer } from './analyzer.js';
export class MemoryOrbService {
    storage;
    analyzer;
    queue = [];
    draining = false;
    closed = false;
    maxQueue;
    now;
    constructor(storage, analyzer = new LocalRuleAnalyzer(), options = {}) {
        this.storage = storage;
        this.analyzer = analyzer;
        this.maxQueue = Math.max(1, options.maxQueue ?? 100);
        this.now = options.now ?? (() => new Date().toISOString());
    }
    enqueue(event) {
        if (this.closed || !this.storage.config.analysisEnabled)
            return false;
        if (event.actor !== 'user' && event.actor !== 'assistant')
            return false;
        if (this.queue.length >= this.maxQueue)
            return false;
        this.queue.push(event);
        this.schedule();
        return true;
    }
    schedule() {
        if (this.draining)
            return;
        this.draining = true;
        queueMicrotask(() => { void this.drain(); });
    }
    async drain() {
        try {
            while (!this.closed && this.queue.length) {
                const event = this.queue.shift();
                if (!event)
                    continue;
                try {
                    const analysis = this.analyzer.analyze(event);
                    const importance = scoreImportance(event);
                    const timestamp = this.now();
                    const orb = {
                        id: 'orb:' + event.id + ':' + LOCAL_ANALYSIS_VERSION,
                        sourceEventIds: [event.id],
                        sessionId: event.sessionId,
                        actor: event.actor === 'user' ? 'user' : 'assistant',
                        timestamp: event.timestamp,
                        emotions: analysis.emotions,
                        emotionConfidence: analysis.emotionConfidence,
                        meaning: analysis.meaning,
                        meaningConfidence: analysis.meaningConfidence,
                        importance: importance.score,
                        importanceReasons: importance.reasons,
                        coreMemoryCandidate: importance.coreMemoryCandidate,
                        tags: [...new Set([...analysis.tags, ...analysis.behaviorStyles])],
                        relatedMemoryIds: [],
                        evidenceEventIds: [event.id],
                        analysisMethod: analysis.analysisMethod,
                        analysisVersion: LOCAL_ANALYSIS_VERSION,
                        reviewStatus: analysis.reviewStatus,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                    };
                    this.storage.saveOrb(orb);
                }
                catch {
                    // Analysis is best effort and must never affect the conversation.
                }
            }
        }
        finally {
            this.draining = false;
            if (!this.closed && this.queue.length)
                this.schedule();
        }
    }
    async flush() {
        if (this.queue.length && !this.draining)
            this.schedule();
        while (this.draining)
            await new Promise((resolve) => setTimeout(resolve, 0));
    }
    close() {
        this.closed = true;
        this.queue.length = 0;
    }
    get queuedCount() {
        return this.queue.length;
    }
}
