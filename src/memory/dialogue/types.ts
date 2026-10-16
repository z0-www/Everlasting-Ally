export type MemoryDomain='real_conversation'|'assistant_experience'|'fictional_roleplay';
export type MemoryKind='original_event'|'user_confirmed_preference'|'assistant_behavior'|'derived_reflection'|'fictional_story';
export interface DialogueMemoryItem {id:string;sourceEventIds:string[];sessionId:string;timestamp:string;memoryKind:MemoryKind;domain:MemoryDomain;content:string;confidence:number;relevance:number;verificationStatus:'confirmed'|'inferred'|'uncertain'|'superseded';correctedBy?:string;selectedReason?:string}
export interface DialogueQuery {message:string;scopeId:string;sessionId?:string;characterId?:string;worldId?:string;storyId?:string;branchId?:string}
export interface DialogueResult {found:boolean;items:DialogueMemoryItem[];context:string;uncertainty:string;hookStatus:'hook_unavailable'}
