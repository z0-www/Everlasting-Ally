export type StyleDimension='warmth'|'humor'|'directness'|'detail'|'proactivity'|'curiosity'|'criticalThinking'|'formality';
export type CommunicationPreferences=Partial<Record<StyleDimension,number>> & {statements?:string[]};
export interface Evidence {id:string; kind:'event'|'reflection'|'correction'; summary:string; confirmed:boolean; createdAt:string;}
export interface ProposedChange {id:string; scopeId:string; kind:'preference'|'guideline'|'style'; value:string; sourceIds:string[]; confidence:number; status:'proposed'|'approved'|'rejected'|'revoked'; createdAt:string;}
export interface ContinuityProfile {id:string; scopeId:string; version:number; communicationPreferences:CommunicationPreferences; observedAssistantStyles:string[]; confirmedBehaviorGuidelines:string[]; proposedChanges:ProposedChange[]; sourceEventIds:string[]; sourceReflectionIds:string[]; confidence:number; lastReviewedAt:string|null; createdAt:string; updatedAt:string; enabled:boolean;}
export const DEFAULT_STYLE:Record<StyleDimension,number>={warmth:.5,humor:.2,directness:.5,detail:.5,proactivity:.4,curiosity:.4,criticalThinking:.7,formality:.5};
