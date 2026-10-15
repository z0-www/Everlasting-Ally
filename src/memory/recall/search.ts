import type { MemoryStorage } from '../storage.js'
import { tokenize } from './tokenizer.js'
import { rankCandidate, rankCandidates } from './ranking.js'
import type { RecallCandidate } from './types.js'

export function searchStoredMemories(storage: MemoryStorage, query: string, maxScan = 1000): RecallCandidate[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const events = storage.listRecentEvents(maxScan).filter((event) => event.actor === 'user' || event.actor === 'assistant')
  const orbs = storage.listRecentOrbs(maxScan)
  const orbByEvent = new Map<string, typeof orbs[number]>()
  for (const orb of orbs) for (const eventId of orb.sourceEventIds) orbByEvent.set(eventId, orb)
  const candidates = events.map((event) => rankCandidate(event, orbByEvent.get(event.id) ?? null, tokens))
  if (storage.config.reflectionEnabled) {
    for (const reflection of storage.listReflections({ limit: maxScan })) {
      const event = reflection.sourceEventIds.map((id) => storage.getEvent(id)).find((item) => item !== null)
      if (event) candidates.push(rankCandidate(event, orbByEvent.get(event.id) ?? null, tokens, reflection))
    }
  }
  return rankCandidates(candidates.filter((candidate) => candidate.matchedTokens.length > 0))
}
