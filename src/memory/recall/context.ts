import type { RecallCandidate } from './types.js'
export const NO_RELIABLE_MEMORY = '未找到足够可靠的记忆。'
function content(candidate: RecallCandidate): string {
  const raw = candidate.event.content
  return typeof raw === 'string' ? raw : JSON.stringify(raw ?? '')
}
export function buildRecallContext(candidates: RecallCandidate[], maxChars = 2000): string {
  if (!candidates.length) return NO_RELIABLE_MEMORY
  const lines: string[] = []
  let used = 0
  for (const candidate of candidates) {
    const body = candidate.reflection ? candidate.reflection.summary + (candidate.reflection.lesson ? ' 经验: ' + candidate.reflection.lesson : '') : content(candidate)
    const line = '[' + candidate.event.actor + '|' + candidate.event.timestamp + '] ' + body + ' (证据: ' + candidate.evidenceEventIds.join(', ') + ')'
    if (used + line.length + 1 > maxChars) break
    lines.push(line)
    used += line.length + 1
  }
  return lines.length ? lines.join('\n') : NO_RELIABLE_MEMORY
}
