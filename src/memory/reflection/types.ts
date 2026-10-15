import type { MemoryEvent } from '../types.js'
import type { MemoryOrb } from '../orb/types.js'

export type ReflectionType = 'mistake' | 'correction' | 'verified_success' | 'unresolved' | 'learning' | 'shared_experience' | 'contradiction'
export type EvidenceStatus = 'complete' | 'partial' | 'insufficient'
export type VerificationStatus = 'confirmed' | 'inferred' | 'needs_review' | 'contradicted' | 'superseded'

export type ReflectionRecord = {
  id: string
  reflectionType: ReflectionType
  title: string
  summary: string
  lesson: string | null
  sourceEventIds: string[]
  sourceOrbIds: string[]
  sessionIds: string[]
  evidenceStatus: EvidenceStatus
  confidence: number
  verificationStatus: VerificationStatus
  analysisMethod: 'local-rules' | 'model-provider' | 'mock'
  analysisVersion: string
  createdAt: string
  updatedAt: string
}

export type ReflectionBudget = {
  reflectionEnabled: boolean
  modelReflectionEnabled: boolean
  maxReflectionEvents: number
  maxInputChars: number
  maxOutputChars: number
  maxModelCalls: number
  maxTokensPerRun: number
  reflectionTimeoutMs: number
}

export type ReflectionInput = {
  events: MemoryEvent[]
  orbs: MemoryOrb[]
}

export type ReflectionAnalyzer = {
  analyze(input: ReflectionInput): ReflectionRecord[]
}
