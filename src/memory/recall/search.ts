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
  return rankCandidates(events.map((event) => rankCandidate(event, orbByEvent.get(event.id) ?? null, tokens))
    .filter((candidate) => candidate.matchedTokens.length > 0))
}
