#!/usr/bin/env node
import {existsSync} from 'node:fs';
import {RoleplayService} from './service.js';
const [,,command,arg,extra,...remaining]=process.argv;
const allowed=['source','list','correct','confirm-correction','delete'];
function nonempty(value:unknown):value is string{return typeof value==='string'&&value.trim().length>0}
try {
 if(!allowed.includes(command)||!nonempty(arg)||remaining.length)throw Error('用法：source ID | list JSON_SCOPE | correct ID "replacement|reason|source" | confirm-correction ID | delete ID');
 const path=process.env.ROLEPLAY_DB;
 if(!nonempty(path)||!existsSync(path))throw Error('必须显式设置 ROLEPLAY_DB，指向已有测试数据库');
 if(process.env.ROLEPLAY_PRIVATE_ACCESS!=='yes')throw Error('需要 ROLEPLAY_PRIVATE_ACCESS=yes 明确授权显示私人测试数据；仅限可信本地终端');
 if(['correct','confirm-correction','delete'].includes(command)&&process.env.ROLEPLAY_CONFIRM!=='yes')throw Error('写入需要 ROLEPLAY_CONFIRM=yes');
 let scope:{worldId:string;storySessionId:string;branchId:string;characterId:string}|undefined;
 if(command==='list'){const parsed=JSON.parse(arg);for(const key of ['worldId','storySessionId','branchId','characterId'])if(!nonempty(parsed?.[key]))throw Error('必须提供完整角色/世界/会话/分支');scope=parsed;}
 const parts=extra?.split('|');if(command==='correct'&&(!parts||parts.length!==3||parts.some(x=>!nonempty(x))))throw Error('更正必须包含正文、原因和来源');
 const service=new RoleplayService(path);
 try {
  if(command==='source')console.log(JSON.stringify(service.sourceOf(arg)));
  if(command==='list'&&scope)console.log(JSON.stringify(service.listMemories(scope)));
  if(command==='correct'&&parts)console.log(service.proposeCorrection(arg,parts[0],parts[1],parts[2]).id);
  if(command==='confirm-correction')console.log(service.confirmCorrection(arg));
  if(command==='delete'){service.deleteMemory(arg);console.log('deleted');}
 }finally{service.close();}
}catch{console.error('操作未执行或失败。检查命令、测试数据库路径、完整作用域及 ROLEPLAY_PRIVATE_ACCESS/ROLEPLAY_CONFIRM 授权。');process.exitCode=1;}
