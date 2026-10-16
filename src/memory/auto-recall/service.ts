import type { MemoryRecallService } from '../recall/service.js'
import type { AutoRecallConfig, AutoRecallInput, AutoRecallResult, ContextExtension } from './types.js'

export class AutoRecallService {
  constructor(
    private readonly recall: MemoryRecallService,
    private readonly config: AutoRecallConfig,
    private readonly extension?: ContextExtension,
  ) {}

  async process(input: AutoRecallInput): Promise<AutoRecallResult> {
    if (!this.config.enabled) return { injected: false, reason: 'disabled', recall: null }
    if (input.event.actor !== 'user') return { injected: false, reason: 'no_reliable_memory', recall: null }
    const started = Date.now()
    const recallOptions = {
      maxResults: this.config.maxResults,
      maxChars: this.config.maxChars,
      minScore: this.config.minScore,
      ...(input.scopeId ? { scopeId: input.scopeId } : {}),
    }
    const result = this.recall.search(typeof input.event.content === 'string' ? input.event.content : '', recallOptions)
    if (Date.now() - started > this.config.timeoutMs) return { injected: false, reason: 'timeout', recall: result }
    if (!result.found) return { injected: false, reason: 'no_reliable_memory', recall: result }
    if (!this.extension) return { injected: false, reason: 'hook_unavailable', recall: result }
    const accepted = await this.extension.inject(result.summary, result.evidenceEventIds)
    return accepted ? { injected: true, reason: 'hook_used', recall: result }
      : { injected: false, reason: 'hook_unavailable', recall: result }
  }
}
