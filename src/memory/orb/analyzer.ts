import type { MemoryEvent } from '../types.js'
import type { EmotionLabel, OrbAnalysis, OrbAnalyzer } from './types.js'

export const LOCAL_ANALYSIS_VERSION = 'local-rules-1'

function textOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  try { return JSON.stringify(value) } catch { return '' }
}

const EMOTION_RULES: Array<[EmotionLabel, RegExp]> = [
  ['joy', /开心|高兴|感谢|谢谢|成功|太棒|喜悦|happy|glad|great|thanks/i],
  ['sadness', /难过|失望|悲伤|遗憾|伤心|sad|disappointed|regret/i],
  ['anger', /生气|愤怒|恼火|讨厌|angry|furious|hate/i],
  ['fear', /害怕|担心|恐惧|焦虑|风险|afraid|fear|worr(?:y|ied)|anxious|risk/i],
  ['curiosity', /为什么|如何|怎么|请问|好奇|探索|why|how|curious|explore/i],
  ['anticipation', /期待|希望|计划|准备|目标|将要|hope|expect|plan|goal|next/i],
  ['surprise', /竟然|没想到|意外|惊讶|surpris|unexpected/i],
]

function userAnalysis(text: string): Pick<OrbAnalysis, 'emotions' | 'emotionConfidence' | 'meaning' | 'meaningConfidence' | 'tags' | 'behaviorStyles' | 'reviewStatus'> {
  const emotions = EMOTION_RULES.filter(([, pattern]) => pattern.test(text)).map(([label]) => label)
  if (!emotions.length) {
    return {
      emotions: text.trim() ? ['neutral'] : ['unknown'],
      emotionConfidence: text.trim() ? 0.25 : 0,
      meaning: null,
      meaningConfidence: 0,
      tags: [],
      behaviorStyles: [],
      reviewStatus: text.trim() ? 'needs_review' : 'unknown',
    }
  }
  return {
    emotions,
    emotionConfidence: Math.min(0.9, 0.45 + emotions.length * 0.1),
    meaning: 'The message contains observable cues that may matter to the user or the current task; review is recommended.',
    meaningConfidence: 0.35,
    tags: emotions,
    behaviorStyles: [],
    reviewStatus: 'needs_review',
  }
}

function assistantAnalysis(text: string): Pick<OrbAnalysis, 'emotions' | 'emotionConfidence' | 'meaning' | 'meaningConfidence' | 'tags' | 'behaviorStyles' | 'reviewStatus'> {
  const behaviorStyles: string[] = []
  if (/可以|帮助|理解|支持|谢谢|抱歉|help|understand|sorry|support/i.test(text)) behaviorStyles.push('supportive')
  if (/分析|因为|步骤|原因|analysis|because|step|reason/i.test(text)) behaviorStyles.push('analytical')
  if (/可能|不确定|也许|需要确认|may|might|uncertain|verify/i.test(text)) behaviorStyles.push('cautious', 'uncertain')
  if (/好奇|探索|wonder|curious/i.test(text)) behaviorStyles.push('curious_style')
  if (/幽默|哈哈|joke|humou?r/i.test(text)) behaviorStyles.push('humorous')
  if (/更正|修正|纠正|实际上|correct|correction/i.test(text)) behaviorStyles.push('corrective')
  if (!behaviorStyles.length) behaviorStyles.push('uncertain')
  return {
    emotions: ['neutral'],
    emotionConfidence: 0.1,
    meaning: 'Observed assistant behavior and wording; this is not evidence of an internal emotion.',
    meaningConfidence: 0.45,
    tags: behaviorStyles,
    behaviorStyles,
    reviewStatus: 'needs_review',
  }
}

export class LocalRuleAnalyzer implements OrbAnalyzer {
  analyze(event: MemoryEvent): OrbAnalysis {
    const text = textOf(event.content)
    const result = event.actor === 'user' ? userAnalysis(text) : assistantAnalysis(text)
    return { ...result, analysisMethod: 'local-rules' }
  }
}

export type AnalysisProvider = {
  readonly name: string
  analyze(event: MemoryEvent, signal?: AbortSignal): Promise<OrbAnalysis>
}

export function createUnavailableModelProvider(): AnalysisProvider {
  return {
    name: 'unavailable',
    async analyze(): Promise<OrbAnalysis> {
      throw new Error('No verified DSH model analysis provider is configured.')
    },
  }
}
