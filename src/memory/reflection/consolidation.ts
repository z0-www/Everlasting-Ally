import type { MemoryEvent } from '../types.js'
import type { MemoryOrb } from '../orb/types.js'
import type { ReflectionRecord } from './types.js'
import { LocalReflectionAnalyzer } from './analyzer.js'

export type ConsolidationOptions = { maxEvents?: number; maxInputChars?: number }

export function consolidateSession(
  events: MemoryEvent[], orbs: MemoryOrb[], options: ConsolidationOptions = {},
): ReflectionRecord[] {
  const bounded = events.slice().sort((a, b) => (a.eventSeq ?? 0) - (b.eventSeq ?? 0)).slice(0, options.maxEvents ?? 100)
  const chars = options.maxInputChars ?? 16000
  let used = 0
  const selected = bounded.filter((event) => {
    const value = JSON.stringify(event.content ?? '')
    if (used + value.length > chars) return false
    used += value.length
    return true
  })
  return new LocalReflectionAnalyzer().analyze({ events: selected, orbs })
}
