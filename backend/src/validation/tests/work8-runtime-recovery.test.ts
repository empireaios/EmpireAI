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

test('supervised observer sidecar is mandatory, bounded, independently hashed, and remains historical',async()=>{
 const f=fixture();try{
  const args={...f.args,captureObserverWatchdog:true};
  await assert.rejects(recovery.captureRuntimeRecoverySet(args),/ENOENT/);assert.equal(fs.existsSync(args.destination),false);
  const file=path.join(f.root,'commissioning/assurance.sqlite.watchdog');
  fs.writeFileSync(file+'.tmp','{}');await assert.rejects(recovery.captureRuntimeRecoverySet(args),/OBSERVER_WATCHDOG_UNSETTLED/);fs.rmSync(file+'.tmp');
  fs.symlinkSync(f.args.authorityFile,file);await assert.rejects(recovery.captureRuntimeRecoverySet(args));fs.rmSync(file);
  fs.writeFileSync(file,'x'.repeat(65537));
  await assert.rejects(recovery.captureRuntimeRecoverySet(args),/OBSERVER_WATCHDOG_SIZE/);assert.equal(fs.existsSync(path.join(args.destination,'runtime-recovery.json')),false);fs.rmSync(args.destination,{recursive:true,force:true});
  fs.writeFileSync(file,JSON.stringify({observedAt:Date.now(),status:'NOT_CHECKED'}));
  const result=await withExclusiveWork8DomainCapture(f.root,()=>recovery.captureRuntimeRecoverySet(args));recovery.finalizeRuntimeRecoverySet(result);
  const manifest=recovery.verifyRuntimeRecoverySet(result);assert.equal(Object.keys(manifest.stores).length,13);assert.equal(manifest.bootAllowed,false);assert.ok(manifest.json.assuranceWatchdog);
  fs.appendFileSync(path.join(result.directory,'assuranceWatchdog.json'),' ');assert.throws(()=>recovery.verifyRuntimeRecoverySet(result));
 }finally{f.close();}
});

test('Redis snapshot time uses the atomic server clock and preserves the row-array API',async()=>{
 const {captureRedisSnapshot,captureRedisInventory}=await import('../../runtime/work8-recovery-capture.js');
 const serverTime=1_800_000_005_000;
 const binaryKey=Buffer.from([0,255,17]),dump=Buffer.from([255,0,123]);
 const queue={queue:{client:Promise.resolve({evalBuffer:async(script:string)=>{
  assert.match(script,/redis.call\('TIME'\)/);
  assert.match(script,/return \{capturedAt, out\}/);
  return [serverTime,[[binaryKey,dump,60000]]];
 }})}};
 const timed=await captureRedisSnapshot(queue as never);
 assert.equal(timed.capturedAt,serverTime);
 assert.deepEqual(timed.rows,[{key:binaryKey.toString('base64'),dump:dump.toString('base64'),ttl:60000}]);
 assert.deepEqual(await captureRedisInventory(queue as never),timed.rows);
 for(const invalid of [0,-1,NaN,1.5,Number.MAX_SAFE_INTEGER+1]){
  const bad={queue:{client:Promise.resolve({evalBuffer:async()=>[invalid,[]]})}};
  await assert.rejects(captureRedisSnapshot(bad as never),/REDIS_SNAPSHOT_TIME_INVALID/);
 }
});

test('Redis snapshot time survives client dispatch delay in the durable recovery manifest',async()=>{
 const f=fixture();try{
  const before=Date.now(),serverSnapshotTime=before+5000;
  const rows=[{key:'c2Vzc2lvbg==',dump:'ZHVtcA==',ttl:60000}];
  // Model five seconds between invocation and execution without sleeping.
  const captured=await withExclusiveWork8DomainCapture(f.root,()=>recovery.captureRuntimeRecoverySet({
   ...f.args,captureRedis:async()=>({capturedAt:serverSnapshotTime,rows})
  }));
  recovery.finalizeRuntimeRecoverySet(captured);
  const m=recovery.verifyRuntimeRecoverySet(captured);
  assert.equal(m.redisCapturedAt,serverSnapshotTime);
  assert.equal(m.redisCapturedAt+rows[0]!.ttl,serverSnapshotTime+60000);
  assert.notEqual(m.redisCapturedAt,before);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(captured.directory,'redis.json'),'utf8')),rows);
  assert.equal(m.bootAllowed,false);assert.equal(m.completeLiveState,false);
 }finally{f.close();}
});

test('Redis snapshot time keeps legacy array callbacks compatible and rejects invalid clock before sealing',async()=>{
 const f=fixture();try{
  const before=Date.now();
  const captured=await withExclusiveWork8DomainCapture(f.root,()=>recovery.captureRuntimeRecoverySet(f.args));
  recovery.finalizeRuntimeRecoverySet(captured);
  const m=recovery.verifyRuntimeRecoverySet(captured);
  assert.ok(m.redisCapturedAt>=before&&m.redisCapturedAt<=Date.now());
 }finally{f.close();}
 const bad=fixture();try{
  await assert.rejects(withExclusiveWork8DomainCapture(bad.root,()=>recovery.captureRuntimeRecoverySet({
   ...bad.args,captureRedis:async()=>({capturedAt:NaN,rows:[]})
  })),/REDIS_SNAPSHOT_TIME_INVALID/);
  assert.equal(fs.existsSync(path.join(bad.args.destination,'runtime-recovery.pending.json')),false);
  assert.equal(fs.existsSync(path.join(bad.args.destination,'runtime-recovery.json')),false);
 }finally{bad.close();}
});
