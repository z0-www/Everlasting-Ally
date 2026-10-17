import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));const temporary=mkdtempSync(join(tmpdir(),'ally-package-'));
function run(args,cwd=root){const result=spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:120000,env:{...process.env,npm_config_cache:process.env.npm_config_cache??join(tmpdir(),'ally-package-npm-cache')}});assert.equal(result.status,0,result.stderr||result.stdout);return result.stdout;}
try {
 const packed=JSON.parse(run([process.env.npm_execpath,'pack','--json','--pack-destination',temporary]));const files=packed[0].files.map(x=>x.path);
 for(const f of ['LICENSE','dist/index.js','dist/host.js','dsh-plugin.json','everlasting-ally.bundle.yml'])assert.ok(files.includes(f),`Missing ${f}`);
 assert.ok(!files.some(f=>/\.sqlite(?:-|$)|\.log$|node_modules\/|dist\/test\//.test(f)),'private or test artifacts in package');
 const target=join(temporary,packed[0].filename);const clean=join(temporary,'clean');mkdirSync(clean);writeFileSync(join(clean,'package.json'),'{}');
 run([process.env.npm_execpath,'install','--ignore-scripts','--omit=dev','--omit=optional','--no-audit','--no-fund',target],clean);
 const entry=pathToFileURL(join(clean,'node_modules/everlasting-ally/dist/index.js')).href;
 run(['--input-type=module','-e',`import assert from 'node:assert/strict';const module=await import(${JSON.stringify(entry)});assert.equal(typeof module.apply,'function');assert.equal(typeof module.RoleplayService,'function');`],clean);
 const artifactDir=resolve(root,'artifacts');mkdirSync(artifactDir,{recursive:true});const {copyFileSync}=await import('node:fs');const destination=join(artifactDir,packed[0].filename);copyFileSync(target,destination);
 const sha=createHash('sha256').update(readFileSync(destination)).digest('hex');writeFileSync(destination+'.sha256',`${sha}  ${packed[0].filename}\n`);
 console.log(JSON.stringify({package:destination,sha256:sha,cleanInstall:true,entryImport:true,files:files.length},null,2));
} finally {rmSync(temporary,{recursive:true,force:true});}
