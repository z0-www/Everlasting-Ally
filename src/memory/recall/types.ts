import type { MemoryEvent } from '../types.js'
import type { MemoryOrb } from '../orb/types.js'

export type RecallCandidate = {
  event: MemoryEvent
  orb: MemoryOrb | null
  score: number
  matchedTokens: string[]
  evidenceEventIds: string[]
}
export type RecallOptions = { maxResults?: number; maxChars?: number; minScore?: number }
export type RecallResult = { found: boolean; summary: string; candidates: RecallCandidate[]; evidenceEventIds: string[] }
