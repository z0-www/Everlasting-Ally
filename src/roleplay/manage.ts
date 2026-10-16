#!/usr/bin/env node
import {RoleplayService} from './service.js';
const [,,command,arg,extra]=process.argv;const db=process.env.ROLEPLAY_DB??'roleplay.sqlite';const s=new RoleplayService(db);
if(command==='source'&&arg)console.log(JSON.stringify(s.sourceOf(arg),null,2));
else if(command==='list'&&arg)console.log(JSON.stringify(s.listMemories(JSON.parse(arg)),null,2));
else if(command==='correct'&&arg&&extra){const [replacement,reason,sourceId]=extra.split('|');console.log(s.proposeCorrection(arg,replacement,reason,sourceId));}
else if(command==='confirm-correction'&&arg){console.log(s.confirmCorrection(arg));}
else if(command==='delete'&&arg){if(process.env.ROLEPLAY_CONFIRM!=='yes')throw Error('set ROLEPLAY_CONFIRM=yes to confirm deletion');s.deleteMemory(arg);console.log('deleted');}
else console.log('Usage: ROLEPLAY_DB=path node dist/roleplay/manage.js source EVENT_ID | list JSON_SCOPE | correct EVENT_ID "replacement|reason|source" | confirm-correction ID | ROLEPLAY_CONFIRM=yes delete EVENT_ID');
