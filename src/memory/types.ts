export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type MemoryActor = 'user' | 'assistant' | 'tool' | 'system'
export type MemoryEventType = 'user_message' | 'assistant_message' | 'tool_call' | 'tool_result' | 'turn_end'
export type CaptureStatus = 'captured' | 'partial' | 'skipped'
export type CandidateType =
  | 'assistant_response'
  | 'decision_candidate'
  | 'tool_execution'
  | 'error_candidate'
  | 'success_candidate'
  | 'correction_candidate'

export type MemorySource = {
  kind: 'dsh_session_event'
  eventName: string
  sessionId: string
  eventSeq: number | null
  timestamp: string
}

export type MemoryEvent = {
  id: string
  sessionId: string
  eventSeq: number | null
  timestamp: string
  actor: MemoryActor
  eventType: MemoryEventType
  content: JsonValue | null
  source: MemorySource
  callId: string | null
  relatedEventIds: string[]
  captureStatus: Exclude<CaptureStatus, 'skipped'>
  createdAt: string
  candidateType?: CandidateType
  emotions: string[] | null
  meaning: string | null
  importance: number | null
  confidence: number | null
  memoryType: string | null
  relatedMemories: string[] | null
}

export type SessionLike = {
  id?: unknown
  sessionId?: unknown
  header?: { id?: unknown; sessionId?: unknown }
}

export type SessionEventLike = {
  type?: unknown
  id?: unknown
  seq?: unknown
  eventSeq?: unknown
  sequence?: unknown
  time?: unknown
  timestamp?: unknown
  createdAt?: unknown
  role?: unknown
  message?: unknown
  content?: unknown
  text?: unknown
  callId?: unknown
  toolCallId?: unknown
  toolName?: unknown
  name?: unknown
  arguments?: unknown
  args?: unknown
  result?: unknown
  error?: unknown
  [key: string]: unknown
}
