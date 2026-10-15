import type { MemoryStorage } from '../storage.js'
import { consolidateSession } from './consolidation.js'
import type { ConsolidationOptions } from './consolidation.js'
import type { ReflectionBudget, ReflectionRecord } from './types.js'

export class ReflectionService {
  constructor(
    private readonly storage: MemoryStorage,
    private readonly budget: ReflectionBudget,
  ) {}

  reflectSession(sessionId: string, options: ConsolidationOptions = {}): ReflectionRecord[] {
    if (!this.budget.reflectionEnabled) return []
    const events = this.storage.listSessionEvents(sessionId).slice(0, this.budget.maxReflectionEvents)
    const orbs = events.flatMap((event) => this.storage.listOrbsForEvent(event.id))
    const records = consolidateSession(events, orbs, {
      maxEvents: Math.min(options.maxEvents ?? this.budget.maxReflectionEvents, this.budget.maxReflectionEvents),
      maxInputChars: Math.min(options.maxInputChars ?? this.budget.maxInputChars, this.budget.maxInputChars),
    })
    for (const reflection of records) this.storage.saveReflection(reflection)
    return records
  }

  consolidateMemories(options: ConsolidationOptions = {}): ReflectionRecord[] {
    if (!this.budget.reflectionEnabled) return []
    const events = this.storage.listRecentEvents(this.budget.maxReflectionEvents)
    const bySession = new Map<string, typeof events>()
    for (const event of events) bySession.set(event.sessionId, [...(bySession.get(event.sessionId) ?? []), event])
    return [...bySession.keys()].flatMap((sessionId) => this.reflectSession(sessionId, options))
  }

  listReflections(options: { sessionId?: string; type?: ReflectionRecord['reflectionType']; limit?: number } = {}): ReflectionRecord[] {
    if (!this.budget.reflectionEnabled) return []
    return this.storage.listReflections(options)
  }

  getReflection(id: string): ReflectionRecord | null {
    if (!this.budget.reflectionEnabled) return null
    return this.storage.getReflection(id)
  }
}
