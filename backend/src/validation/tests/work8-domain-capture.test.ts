import assert from 'node:assert/strict';
import {test, mock} from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess, {spawnSync, type ChildProcess} from 'node:child_process';
import {DatabaseSync, backup} from 'node:sqlite';
import {createRequire, syncBuiltinESMExports} from 'node:module';
import {withExclusiveWork8DomainCapture} from '../../runtime/native-store-capture.js';
const require=createRequire(import.meta.url);
const {STORES}=require('../../../../deployment/work8-system-vault.cjs') as {STORES:Record<string,string>};
const write=(file:string)=>spawnSync(process.execPath,['-e',`
const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(process.argv[1],{timeout:0});
try {db.exec("BEGIN IMMEDIATE; INSERT INTO evidence VALUES('later',2); COMMIT");}
catch(e){process.stderr.write(String(e));process.exitCode=7;}finally{db.close();}`,file],{encoding:'utf8',timeout:5000});
function setup(mode:'wal'|'delete'){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'domain-capture-'));const dbs:DatabaseSync[]=[];
 for(const relative of Object.values(STORES)){const file=path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec(`PRAGMA journal_mode=${mode}; CREATE TABLE evidence(id TEXT PRIMARY KEY,n INTEGER); INSERT INTO evidence VALUES('original',1)`);dbs.push(db);}
 return {root,dbs,close(){for(const db of dbs)db.close();fs.rmSync(root,{recursive:true,force:true});}};
}
for(const mode of ['wal','delete'] as const)test(`all nine ${mode} domains exclude process writers and preserve copied committed rows`,async()=>{
 const x=setup(mode);try{
  await withExclusiveWork8DomainCapture(x.root,async()=>{
   for(const [id,relative] of Object.entries(STORES)){
    const file=path.join(x.root,relative),denied=write(file);assert.equal(denied.status,7,denied.stderr);assert.match(denied.stderr,/locked/);
    const destination=path.join(x.root,id+'.copy');
    if(mode==='wal'){const reader=new DatabaseSync(file,{readOnly:true});try{await backup(reader,destination);}finally{reader.close();}}
    else fs.copyFileSync(file,destination);
    const copied=new DatabaseSync(destination,{readOnly:true});try{assert.deepEqual(copied.prepare('SELECT id,n FROM evidence').all().map(r=>({...r})),[{id:'original',n:1}]);assert.equal(copied.prepare('PRAGMA integrity_check').get()?.integrity_check,'ok');}finally{copied.close();}
   }
   await assert.rejects(withExclusiveWork8DomainCapture(x.root,()=>assert.fail('overlap accepted')),/locked/);
  });
  for(const relative of Object.values(STORES))assert.equal(write(path.join(x.root,relative)).status,0);
 }finally{x.close();}
});
test('late acquisition failure releases earlier locks; no callback, missing domain or symlink accepted',async()=>{
 const x=setup('wal');try{
  const held=x.dbs.at(-1)!;held.exec('BEGIN IMMEDIATE');let captured=false;
  await assert.rejects(withExclusiveWork8DomainCapture(x.root,()=>{captured=true;}),/locked/);assert.equal(captured,false);held.exec('ROLLBACK');
  assert.equal(write(path.join(x.root,STORES.intelligence!)).status,0);
  await assert.rejects(withExclusiveWork8DomainCapture(x.root,()=>{throw Error('verification refused');}),/verification refused/);
  const last=path.join(x.root,STORES.commerce!);fs.renameSync(last,last+'.retained');
  await assert.rejects(withExclusiveWork8DomainCapture(x.root,()=>assert.fail('missing accepted')),/ENOENT/);
  fs.symlinkSync(last+'.retained',last);
  await assert.rejects(withExclusiveWork8DomainCapture(x.root,()=>assert.fail('link accepted')),/unsafe/);
  fs.unlinkSync(last);fs.renameSync(last+'.retained',last);
 }finally{x.close();}
});

test('lost lock holder and replaced source path prevent successful capture acknowledgment',async()=>{
 const x=setup('wal');const originalFork=childProcess.fork;let holder:ChildProcess|undefined;
 const spy=mock.method(childProcess,'fork',(...args:Parameters<typeof originalFork>)=>{holder=originalFork(...args);return holder;});syncBuiltinESMExports();
 try{
  await assert.rejects(withExclusiveWork8DomainCapture(x.root,async()=>{
   assert.ok(holder);holder.kill('SIGKILL');
   await new Promise(resolve=>setTimeout(resolve,50));
  }),/holder lost/);
  assert.equal(write(path.join(x.root,STORES.intelligence!)).status,0);
  const last=path.join(x.root,STORES.commerce!);
  await assert.rejects(withExclusiveWork8DomainCapture(x.root,()=>{
   fs.renameSync(last,last+'.retained');fs.copyFileSync(last+'.retained',last);
  }),/release failed/);
  fs.unlinkSync(last);fs.renameSync(last+'.retained',last);
 }finally{spy.mock.restore();syncBuiltinESMExports();x.close();}
});
