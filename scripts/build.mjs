import {spawnSync} from 'node:child_process';
import {rmSync,writeFileSync} from 'node:fs';
rmSync(new URL('../dist/',import.meta.url),{recursive:true,force:true});
const result=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','-p','tsconfig.json'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status??1);
writeFileSync(new URL('../dist/.npmignore',import.meta.url),'test/\n');
