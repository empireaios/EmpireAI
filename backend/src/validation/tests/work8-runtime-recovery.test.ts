import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {withExclusiveWork8DomainCapture} from '../../runtime/native-store-capture.js';
const require=createRequire(import.meta.url);
const vault=require('../../../../deployment/work8-system-vault.cjs');
const recovery=require('../../../../deployment/work8-recovery-set.cjs');
function fixture(){
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'runtime-recovery-')),root=path.join(base,'volume');fs.mkdirSync(root);
 const primaryPath=path.join(root,'brain.db'),shadowPath=path.join(root,'shadow.db');
 const files=[...Object.values(vault.STORES) as string[]].map(x=>path.join(root,x)).concat([primaryPath,primaryPath+'.missions.sqlite',primaryPath+'.mission-execution.sqlite',shadowPath]);
 const handles:DatabaseSync[]=[];
 for(const [i,file] of files.entries()){fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec(`PRAGMA journal_mode=${i%2?'DELETE':'WAL'};CREATE TABLE canonical(id TEXT PRIMARY KEY,value INTEGER);INSERT INTO canonical VALUES('retained',${i});`);handles.push(db);}
 const authorityFile=path.join(root,'authority.json'),requestOwnersFile=path.join(root,'owners.json');fs.writeFileSync(authorityFile,JSON.stringify({approvals:['historical']}));fs.writeFileSync(requestOwnersFile,'{}');
 return {base,root,files,args:{root,primaryPath,shadowPath,authorityFile,requestOwnersFile,destination:path.join(base,'capture'),sourceCommit:'a'.repeat(40),frontendRevision:'b'.repeat(40),captureId:randomUUID(),captureRedis:async()=>[{key:'a2V5',dump:'ZHVtcA==',ttl:-1}]},close(){for(const db of handles)db.close();fs.rmSync(base,{recursive:true,force:true});}};
}
test('integrated inventory retains all thirteen stores including WAL records, stages empty isolated inspection, rejects tampering',async()=>{
 const f=fixture();try{
  const captured=await withExclusiveWork8DomainCapture(f.root,()=>recovery.captureRuntimeRecoverySet(f.args));
  assert.equal(fs.existsSync(path.join(captured.directory,'runtime-recovery.json')),false);
  assert.throws(()=>recovery.verifyRuntimeRecoverySet(captured),/ENOENT/);
  assert.throws(()=>recovery.stageRuntimeRecoveryInspection({...captured,destination:path.join(f.base,'premature')}),/ENOENT/);
  recovery.finalizeRuntimeRecoverySet(captured);
  const m=recovery.verifyRuntimeRecoverySet(captured);assert.equal(Object.keys(m.stores).length,13);assert.ok(m.stores.liveCostCentre);assert.ok(m.stores.execution);assert.equal(m.completeLiveState,false);assert.equal(m.bootAllowed,false);
  const staged=recovery.stageRuntimeRecoveryInspection({...captured,destination:path.join(f.base,'inspection')});assert.equal(staged.bootAllowed,false);
  for(const id of Object.keys(m.stores)){const db=new DatabaseSync(path.join(staged.directory,'sealed-evidence',id,'checkpoint.db'),{readOnly:true});try{assert.equal(db.prepare('SELECT count(*) AS n FROM canonical').get()!.n,1);}finally{db.close();}}
  assert.throws(()=>recovery.stageRuntimeRecoveryInspection({...captured,destination:staged.directory}),/EEXIST/);
  fs.appendFileSync(path.join(captured.directory,'redis.json'),' ');assert.throws(()=>recovery.verifyRuntimeRecoverySet(captured));
 }finally{f.close();}
});
test('missing mandatory financial or mission store refuses before destination is created',async()=>{
 for(const suffix of ['commissioning/openai-october-2026.sqlite','brain.db.mission-execution.sqlite']){const f=fixture();try{fs.renameSync(path.join(f.root,suffix),path.join(f.root,suffix)+'.absent');await assert.rejects(recovery.captureRuntimeRecoverySet(f.args),/ENOENT/);assert.equal(fs.existsSync(f.args.destination),false);}finally{f.close();}}
});
test('Redis interruption after SQLite copies cannot leave a success manifest',async()=>{
 const f=fixture();try{await assert.rejects(withExclusiveWork8DomainCapture(f.root,()=>recovery.captureRuntimeRecoverySet({...f.args,captureRedis:async()=>{throw new Error('Redis interrupted');}})),/Redis interrupted/);assert.equal(fs.existsSync(path.join(f.args.destination,'runtime-recovery.json')),false);}finally{f.close();}
});

test('complete runtime capture defaults to refusal instead of accepting a scoped inventory',async()=>{
 const {captureWork8RecoveryInventory}=await import('../../runtime/work8-recovery-capture.js');
 const f=fixture();try{
  for(const requireComplete of [undefined,true])await assert.rejects(captureWork8RecoveryInventory({...f.args,requireComplete},{root:f.root,primaryPath:f.args.primaryPath,shadowPath:f.args.shadowPath},undefined as never),/FULL_RUNTIME_CAPTURE_UNPROVEN/);
  assert.equal(fs.existsSync(f.args.destination),false);
 }finally{f.close();}
});
