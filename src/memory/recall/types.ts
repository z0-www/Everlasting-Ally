import type { MemoryEvent } from '../types.js'
import type { MemoryOrb } from '../orb/types.js'
import type { ReflectionRecord } from '../reflection/types.js'

export type RecallCandidate = {
  event: MemoryEvent
  orb: MemoryOrb | null
  score: number
  matchedTokens: string[]
  evidenceEventIds: string[]
  reflection?: ReflectionRecord
}
export type RecallOptions = { maxResults?: number; maxChars?: number; minScore?: number; scopeId?: string }
export type RecallResult = { found: boolean; summary: string; candidates: RecallCandidate[]; evidenceEventIds: string[] }
