import type { MemoryOrb } from '../orb/types.js'
import type { MemoryEvent } from '../types.js'
import type { RecallCandidate } from './types.js'

function textOf(event: MemoryEvent, orb: MemoryOrb | null): string {
  return [
    typeof event.content === 'string' ? event.content : JSON.stringify(event.content ?? ''),
    ...(orb ? [...orb.tags, ...orb.emotions, orb.meaning ?? ''] : []),
  ].join(' ').toLocaleLowerCase()
}

export function rankCandidate(event: MemoryEvent, orb: MemoryOrb | null, tokens: string[], reflection?: RecallCandidate['reflection']): RecallCandidate {
  const text = (textOf(event, orb) + ' ' + (reflection ? reflection.title + ' ' + reflection.summary + ' ' + (reflection.lesson ?? '') : '')).toLocaleLowerCase()
  const matchedTokens = tokens.filter((token) => text.includes(token))
  const keywordScore = tokens.length ? matchedTokens.length / tokens.length : 0
  const importanceScore = orb?.importance ?? 0
  const confidence = orb?.emotionConfidence ?? 0
  const score = Math.min(1, keywordScore * 0.65 + importanceScore * 0.25 + confidence * 0.1)
  return {
    event, orb, score, matchedTokens,
    ...(reflection ? { reflection } : {}),
    evidenceEventIds: reflection?.sourceEventIds ?? (orb?.evidenceEventIds.length ? orb.evidenceEventIds : [event.id]),
  }
}
export function rankCandidates(candidates: RecallCandidate[]): RecallCandidate[] {
  return candidates.sort((a, b) => b.score - a.score || b.event.timestamp.localeCompare(a.event.timestamp))
}
