import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
for(const name of ['roleplay-memory','emotional-roleplay','memory-dialogue','companion-roleplay','roleplay-continuity','integrated-memory']){
 const result=spawnSync(process.execPath,[fileURLToPath(new URL(`../examples/${name}-demo.mjs`,import.meta.url))],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status??1);
}
