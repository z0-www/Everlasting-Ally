import type { MemoryEvent } from '../types.js'

export type EmotionLabel = 'joy' | 'sadness' | 'anger' | 'fear' | 'curiosity' | 'anticipation' | 'surprise' | 'neutral' | 'unknown'
export type OrbActor = 'user' | 'assistant'
export type AnalysisMethod = 'local-rules' | 'model-provider' | 'mock'
export type ReviewStatus = 'reviewed' | 'needs_review' | 'unknown'

export type MemoryOrb = {
  id: string
  sourceEventIds: string[]
  sessionId: string
  actor: OrbActor
  timestamp: string
  emotions: EmotionLabel[]
  emotionConfidence: number
  meaning: string | null
  meaningConfidence: number
  importance: number
  importanceReasons: string[]
  coreMemoryCandidate: boolean
  tags: string[]
  relatedMemoryIds: string[]
  evidenceEventIds: string[]
  analysisMethod: AnalysisMethod
  analysisVersion: string
  reviewStatus: ReviewStatus
  createdAt: string
  updatedAt: string
}

export type OrbAnalysis = {
  emotions: EmotionLabel[]
  emotionConfidence: number
  meaning: string | null
  meaningConfidence: number
  tags: string[]
  behaviorStyles: string[]
  analysisMethod: AnalysisMethod
  reviewStatus: ReviewStatus
}

export type OrbAnalyzer = {
  analyze(event: MemoryEvent): OrbAnalysis
}
