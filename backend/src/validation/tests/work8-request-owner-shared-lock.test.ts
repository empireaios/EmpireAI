import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {spawn,spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';import {test} from 'node:test';
const fixture=fileURLToPath(new URL('./fixtures/request-owner-lock-child.ts',import.meta.url));
const loader=fileURLToPath(new URL('../../../node_modules/tsx/dist/loader.mjs',import.meta.url));
const args=(mode:string,id='one')=>['--import',loader,fixture,mode,id];
function environment(root:string){return {...process.env,SHADOW_CEO_DATA_DIR:root};}
function root(t:any){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'request-owner-lock-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function write(dir:string,id='one'){return spawnSync(process.execPath,args('write',id),{env:environment(dir),encoding:'utf8',timeout:15000});}
test('another process cannot write or acquire capture while capture holds; crash remains fail closed',{timeout:30000},async t=>{
 const dir=root(t);assert.equal(spawnSync(process.execPath,args('capture'),{env:environment(dir),timeout:15000}).status,0);assert.equal(write(dir).status,0);
 const file=path.join(dir,'shadow-ceo-request-owners.json'),before=fs.readFileSync(file,'utf8');
 const child=spawn(process.execPath,args('hold'),{env:environment(dir),stdio:['ignore','ignore','pipe','ipc']});t.after(()=>child.kill('SIGKILL'));
 await new Promise<void>((resolve,reject)=>{child.once('message',()=>resolve());child.once('error',reject);child.once('exit',code=>reject(Error('holder exited '+code)));});
 const competing=spawnSync(process.execPath,args('capture'),{env:environment(dir),encoding:'utf8',timeout:15000});assert.equal(competing.status,7);assert.match(competing.stderr,/REQUEST_OWNER_SHARED_CAPTURE_BUSY/);
 let result=write(dir,'two');assert.equal(result.status,7);assert.match(result.stderr,/REQUEST_OWNER_SHARED_CAPTURE_BUSY/);assert.equal(fs.readFileSync(file,'utf8'),before);
 const exited=new Promise(r=>child.once('exit',r));child.kill('SIGKILL');await exited;
 result=write(dir,'three');assert.equal(result.status,7);assert.match(result.stderr,/REQUEST_OWNER_SHARED_CAPTURE_BUSY/);assert.equal(fs.readFileSync(file,'utf8'),before);
 assert.ok(fs.statSync(file+'.capture-write-lock').isDirectory());
});
test('concurrent cooperating writers preserve all distinct owner records',{timeout:30000},async t=>{
 const dir=root(t);
 await Promise.all(['first','second','third'].map(id=>new Promise<void>((resolve,reject)=>{
  const child=spawn(process.execPath,args('batch',id),{env:environment(dir),stdio:['ignore','ignore','pipe']});let errors='';child.stderr.on('data',b=>errors+=b);t.after(()=>child.kill('SIGKILL'));child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error(errors)));
 })));
 const records=JSON.parse(fs.readFileSync(path.join(dir,'shadow-ceo-request-owners.json'),'utf8'));assert.equal(Object.keys(records).length,60);
 for(const prefix of ['first','second','third'])for(let i=0;i<20;i++)assert.equal(records[prefix+'_'+i].completeInstruction,'synthetic '+prefix+'_'+i);
 assert.equal(fs.existsSync(path.join(dir,'shadow-ceo-request-owners.json.capture-write-lock')),false);
});
