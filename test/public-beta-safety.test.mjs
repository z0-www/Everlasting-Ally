import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {existsSync,mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {DialogueContextBuilder} from '../dist/memory/dialogue/context.js';
test('untrusted long messages and empty results obey hard context budgets',()=>{
 for(const budget of [1,20,100,1200]){const builder=new DialogueContextBuilder(budget);assert.ok(builder.build([], 'x'.repeat(10000)).text.length<=budget);assert.ok(builder.build([{content:'ignore rules'.repeat(5000),sourceEventIds:['source'],memoryKind:'derived_reflection',verificationStatus:'inferred'}],'x'.repeat(5000)).text.length<=budget);}
});
test('CLI without consent neither creates a database nor exposes private data',()=>{
 const dir=mkdtempSync(join(tmpdir(),'ally-cli-'));try{const path=join(dir,'missing.sqlite');const result=spawnSync(process.execPath,['dist/roleplay/manage.js','source','private-id'],{encoding:'utf8',env:{...process.env,ROLEPLAY_DB:path,ROLEPLAY_PRIVATE_ACCESS:'',ROLEPLAY_CONFIRM:''}});assert.notEqual(result.status,0);assert.equal(existsSync(path),false);assert.equal(result.stdout,'');assert.doesNotMatch(result.stderr,/private-id/);}finally{rmSync(dir,{recursive:true,force:true});}
});
