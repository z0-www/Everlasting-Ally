import { buildRecallContext, NO_RELIABLE_MEMORY } from './context.js';
import { searchStoredMemories } from './search.js';
export class MemoryRecallService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    search(query, options = {}) {
        const maxResults = Math.max(1, Math.min(10, Math.floor(options.maxResults ?? 5)));
        const maxChars = Math.max(100, Math.min(4000, Math.floor(options.maxChars ?? 2000)));
        const minScore = options.minScore ?? 0.18;
        const candidates = searchStoredMemories(this.storage, query).filter((candidate) => candidate.score >= minScore).slice(0, maxResults);
        const summary = buildRecallContext(candidates, maxChars);
        return { found: summary !== NO_RELIABLE_MEMORY, summary, candidates, evidenceEventIds: [...new Set(candidates.flatMap((candidate) => candidate.evidenceEventIds))] };
    }
}
