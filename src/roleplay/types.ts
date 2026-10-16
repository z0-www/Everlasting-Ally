export type RoleplayMode='assistant'|'roleplay'|'emotional_companion'|'narrative';
export type RelationshipType='friendship'|'partnership'|'family'|'mentorship'|'rivalry'|'romance'|'custom';
export type StoryEventType='dialogue'|'narration'|'user_choice'|'plot_event'|'correction';
export type CanonicalStatus='proposed'|'confirmed'|'superseded';
export interface StoryEvent {id:string;storySessionId:string;worldId:string;characterId:string;branchId:string;actor:'user'|'character'|'system';content:string;eventType:StoryEventType;timestamp:string;canonicalStatus:CanonicalStatus}
export type CorrectionStatus='proposed'|'confirmed'|'rejected';
export interface MemoryCorrection {id:string;eventId:string;replacement:string;reason:string;sourceId:string;status:CorrectionStatus;createdAt:string;authorizedAt?:string}
export interface EmotionalConversationContext {characterId:string;scene:string;confirmedEvents:StoryEvent[];relationships:RelationshipState[];style:string;uncertainty:string}
export interface CharacterProfile {characterId:string;name:string;description:string;appearanceDescription?:string;background:string;personalityTraits:string[];communicationStyle:string;motivations:string[];personalGoals:string[];relationships:string[];storyRole:string;boundaries:string[];worldId:string;version:number;archived:boolean;createdAt:string;updatedAt:string}
export interface StoryWorld {worldId:string;name:string;description:string;storyFacts:string[];createdAt:string;updatedAt:string}
export interface SceneMemory {sceneId:string;worldId:string;storyId:string;branchId:string;characterIds:string[];setting:string;timeline:string;location:string;sceneSummary:string;eventIds:string[];storyFacts:string[];unresolvedPlotPoints:string[];createdAt:string;updatedAt:string}
export interface RelationshipState {relationshipId:string;participantIds:string[];worldId:string;relationshipType:RelationshipType;relationshipSummary:string;trustEvents:string[];conflictEvents:string[];reconciliationEvents:string[];keyMoments:string[];sourceEventIds:string[];status:'active'|'paused'|'ended';updatedAt:string}
export interface RoleplaySession {sessionId:string;mode:RoleplayMode;worldId?:string;storyId?:string;branchId?:string;characterId?:string;active:boolean;createdAt:string;updatedAt:string}
