import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawnSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {MemoryStorage} from '../dist/memory/storage.js';import {MemoryCapture} from '../dist/memory/capture.js';import {resolveMemoryConfig} from '../dist/memory/config.js';import {MemoryRecallService} from '../dist/memory/recall/service.js';import {MemoryOrbService} from '../dist/memory/orb/service.js';import {ReflectionService} from '../dist/memory/reflection/service.js';
test('opt-in real memory lifecycle, process recovery, analysis, reflection and erasure',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ally-lifecycle-'));const databasePath=join(dir,'test.sqlite');let storage,orbs;
 try {
  storage=new MemoryStorage(resolveMemoryConfig({memory:{databasePath}}));const capture=new MemoryCapture();const event=capture.capture({id:'life'},{type:'user/message',id:'u',content:'虚构项目 Atlas 配置不对，应该使用新版本'});
  assert.equal(storage.saveEvent(event).saved,false);assert.equal(existsSync(databasePath),false);storage.close();
  storage=new MemoryStorage(resolveMemoryConfig({memory:{enabled:true,analysisEnabled:true,recallEnabled:true,reflectionEnabled:true,databasePath}}));
  for(const e of [event,capture.capture({id:'life'},{type:'assistant/message',id:'a',content:'Atlas 配置应先核对版本'}),capture.capture({id:'life'},{type:'tool/result',id:'t',callId:'call',result:{ok:false,error:'Atlas compatibility failure'}})])assert.equal(storage.saveEvent(e).saved,true);
  orbs=new MemoryOrbService(storage);orbs.enqueue(storage.getEvent('u'));await orbs.flush();assert.ok(storage.listOrbsForEvent('u').length);orbs.close();storage.close();
  const moduleUrl=pathToFileURL(join(process.cwd(),'dist/memory/storage.js')).href;
  const configUrl=pathToFileURL(join(process.cwd(),'dist/memory/config.js')).href;
  const code=`import {MemoryStorage} from ${JSON.stringify(moduleUrl)};import {resolveMemoryConfig} from ${JSON.stringify(configUrl)};const s=new MemoryStorage(resolveMemoryConfig({memory:{enabled:true,databasePath:process.argv[1]}}));try{console.log(JSON.stringify(s.listSessionEvents('life').map(e=>e.id).sort()))}finally{s.close()}`;
  const child=spawnSync(process.execPath,['--input-type=module','-e',code,databasePath],{encoding:'utf8',timeout:15000});assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),['a','t','u']);
  storage=new MemoryStorage(resolveMemoryConfig({memory:{enabled:true,recallEnabled:true,reflectionEnabled:true,databasePath}}));
  const recall=new MemoryRecallService(storage).search('Atlas');assert.equal(recall.found,true);assert.ok(recall.evidenceEventIds.length);
  const reflection=new ReflectionService(storage,{reflectionEnabled:true,modelReflectionEnabled:false,maxReflectionEvents:20,maxInputChars:4000,maxOutputChars:1000,maxModelCalls:0,maxTokensPerRun:0,reflectionTimeoutMs:1000});assert.ok(reflection.reflectSession('life').length);
  assert.equal(storage.deleteEvent('u'),true);assert.equal(storage.getEvent('u'),null);assert.equal(storage.listOrbsForEvent('u').length,0);assert.ok(storage.listReflections({sessionId:'life'}).every(r=>!r.sourceEventIds.includes('u')));
  storage.close();storage=new MemoryStorage(resolveMemoryConfig({memory:{enabled:false,databasePath}}));assert.equal(storage.saveEvent(event).saved,false);
 } finally {orbs?.close();storage?.close();rmSync(dir,{recursive:true,force:true});}
});
