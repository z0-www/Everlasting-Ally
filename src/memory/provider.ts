import type { MemoryStorage } from './storage.js'
import { MemoryRecallService } from './recall/service.js'
import type { RecallOptions, RecallResult } from './recall/types.js'

/** Read-only domain contract. trustedScopeId must come from application identity, never model arguments. */
export interface MemoryReader {
  search(query: string, trustedScopeId: string, options?: Omit<RecallOptions, 'scopeId'>): RecallResult
}

/** Borrows the existing runtime connection; never opens, closes or writes a second database. */
export class SqliteMemoryReader implements MemoryReader {
  constructor(private readonly storage: MemoryStorage) {}
  search(query: string, trustedScopeId: string, options: Omit<RecallOptions, 'scopeId'> = {}): RecallResult {
    if (!this.storage.available || !this.storage.config.enabled || !this.storage.config.recallEnabled ||
        !trustedScopeId || trustedScopeId !== this.storage.config.scopeId) {
      return { found: false, summary: '未找到足够可靠的记忆。记忆检索未启用或作用域不匹配。', candidates: [], evidenceEventIds: [] }
    }
    return new MemoryRecallService(this.storage).search(query, { ...options, scopeId: trustedScopeId })
  }
}
