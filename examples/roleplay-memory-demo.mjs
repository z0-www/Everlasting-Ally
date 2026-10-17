import {mkdtempSync as makeDemoDir, rmSync as removeDemoDir} from 'node:fs';
import {tmpdir as demoTempRoot} from 'node:os';
import {join as demoJoin} from 'node:path';
import {RoleplayService,RoleplayContextBuilder} from '../dist/index.js';
import {rmSync} from 'node:fs';
const demoDir=makeDemoDir(demoJoin(demoTempRoot(),'ally-demo-')); const db=demoJoin(demoDir,'story.sqlite'); const connections=[]; function openStory(){const connection=new RoleplayService(db);connections.push(connection);return connection;} try {
let store=openStory();const world=store.createWorld({name:'艾斯特拉森林',description:'虚构的魔法森林',storyFacts:['符文石记录古老路线']});const c=store.createCharacter({name:'艾琳',description:'旅行法师',background:'寻找失落的图书馆',personalityTraits:['谨慎','好奇'],communicationStyle:'温和、解释充分',motivations:['解读遗迹'],personalGoals:['找到图书馆'],relationships:[],storyRole:'法师',boundaries:[],worldId:world.worldId});const session=store.startSession({mode:'roleplay',worldId:world.worldId,storyId:'forest-story',branchId:'main',characterId:c.characterId});store.saveEvent({id:'forest-rune-1',storySessionId:session.sessionId,worldId:world.worldId,characterId:c.characterId,branchId:'main',actor:'user',content:'我们在森林中发现了一块刻有符文的石头。',eventType:'plot_event',canonicalStatus:'confirmed'});store.close();
store=openStory();const found=store.recallEvents({worldId:world.worldId,storySessionId:session.sessionId,branchId:'main',characterId:c.characterId});const context=new RoleplayContextBuilder(1000).build(c,world,found,[],'森林入口','我们之前发现了什么？');if(found.length!==1||found[0].id!=='forest-rune-1'||!context.includes('forest-rune-1'))throw Error('SQLite recall assertion failed');console.log(JSON.stringify({recovered:found.map(x=>({id:x.id,content:x.content})),context},null,2));store.close();

} finally {for(const connection of connections.reverse())connection.close();removeDemoDir(demoDir,{recursive:true,force:true});}
