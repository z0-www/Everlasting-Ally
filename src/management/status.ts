import {DatabaseSync} from 'node:sqlite';import {RuntimeMode} from '../runtime/types.js';
export interface PluginStatus {version:string;memoryEnabled:boolean;continuityEnabled:boolean;roleplayEnabled:boolean;mode:RuntimeMode;scope:string;hookStatus:'hook_unavailable'|'verified'}
export function getPluginStatus(scope='local-user',mode:RuntimeMode='assistant'):PluginStatus{return {version:'1.0.0-rc.1',memoryEnabled:true,continuityEnabled:false,roleplayEnabled:false,mode,scope,hookStatus:'hook_unavailable'}}
export function databaseHealth(path=':memory:'){const db=new DatabaseSync(path);try{return {ok:true,integrity:(db.prepare('PRAGMA integrity_check').get() as any).integrity_check}}finally{db.close()}}
