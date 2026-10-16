export type RuntimeMode='assistant'|'companion'|'roleplay'|'narrative';
export interface ContextItem {kind:'fact'|'inference'|'fiction';text:string;sourceId?:string;}
export interface RuntimeScope {scopeId:string;worldId?:string;storyId?:string;branchId?:string;characterId?:string;}
