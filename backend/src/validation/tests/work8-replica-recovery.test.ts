import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {captureTwinCheckpoint,initializeTwinRecoveryTarget,replayTwinCheckpoint} from '../../runtime/commerce-runtime/governed/work8-twin-recovery.js';

test('another process cannot interleave canonical checkpoint tables; receipt-before-cursor survives isolated replay',async()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-replica-')),p={workspace:'synthetic:replica',owner:'owner'},now=1791676800000;
 const open=(name:string)=>{const store=new GovernedCommerceStore(path.join(root,name)),sessions=new Work8TwinSessions(store,()=>now),worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));return new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));};
 const source=open('source.sqlite'),target=open('target.sqlite'),barrier=new Int32Array(new SharedArrayBuffer(4));let child:ReturnType<typeof spawn>|undefined,exited:Promise<{code:number|null;error?:Error}>|undefined;
 const wait=(name:string)=>{const end=Date.now()+15000;while(!fs.existsSync(path.join(root,name))){if(Date.now()>end)throw Error('REPLICA_BARRIER_TIMEOUT:'+name);Atomics.wait(barrier,0,0,10);}return fs.readFileSync(path.join(root,name),'utf8');};
 try{
  source.sessions.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});source.sessions.transition(p,{id:'resume',sessionId:'exam',expectedVersion:1,action:'RESUME'});
  source.admit(p,{id:'cohort',sessionId:'exam',expectedVersion:2,count:2,authorizeLabelledFixtures:true});source.authority.command(p,{action:'GRANT',id:'grant',sessionId:'exam',expectedVersion:0,mode:'ONE_HOUR'});
  const fault=source.inject(p,{id:'gap',sessionId:'exam',expectedVersion:2,kind:'COMMITTED_RECEIPT_CURSOR_GAP'}),w=source.sessions.read(p,'exam').twinWorkspace;
  const original=source.store.history(w,fault.missionId);assert.equal(original.length,1);assert.equal(source.worker.get(w,fault.taskId)!.cursor,0);
  child=spawn(process.execPath,['--import','tsx',fileURLToPath(new URL('./work8-replica-writer.fixture.ts',import.meta.url)),source.store.filename,root],{stdio:['ignore','ignore','pipe'],env:process.env});
  let stderr='';child.stderr!.on('data',b=>{stderr+=b;});exited=new Promise(resolve=>{child!.once('error',error=>resolve({code:null,error}));child!.once('exit',code=>resolve({code}));});
  wait('ready');
  const version={applicationRevision:'a'.repeat(40),configurationDigest:digest({scope:'same-host-canonical-store-only'})};
  const first=source.store.transaction(()=>{
   fs.writeFileSync(path.join(root,'locked'),'go');const refused=JSON.parse(wait('locked.json'));assert.equal(refused.status,'REFUSED');assert.match(refused.message,/locked|busy/i);
   const pack=captureTwinCheckpoint(source,p,'exam',version);assert.equal(source.sessions.read(p,'exam').version,2);return pack;
  });
  fs.writeFileSync(path.join(root,'released'),'go');assert.deepEqual(JSON.parse(wait('released.json')),{status:'COMMITTED',version:3});const end=await exited;assert.ifError(end.error);assert.equal(end.code,0,stderr);
  const second=captureTwinCheckpoint(source,p,'exam',version,first);assert.equal(first.tables.work8_twin_events!.length,2);assert.equal(second.tables.work8_twin_events!.length,3);
  initializeTwinRecoveryTarget(target.store);replayTwinCheckpoint(target,first,first.digest);
  assert.equal(target.worker.get(w,fault.taskId)!.cursor,0);assert.deepEqual(target.store.history(w,fault.missionId),original);
  assert.throws(()=>target.tick(p,'exam',2),/TWIN_AUTHORITY_NOT_GRANTED/);
  replayTwinCheckpoint(target,second,second.digest);assert.equal(target.sessions.read(p,'exam').status,'PAUSED');assert.equal(target.authority.read(p,'exam').status,'NOT_GRANTED');
  // The real worker replays the same command identity, closing the interrupted
  // cursor gap without a second receipt. This is an isolated internal exam.
  const repaired=target.worker.tick(w,fault.taskId,0);assert.equal(repaired.cursor,1);assert.deepEqual(target.store.history(w,fault.missionId),original);
  assert.equal(target.store.db.prepare('SELECT count(*) n FROM work8_sim_finance_events').get()!.n,0);
  assert.equal(original[0]!.externalEffects,0);
  console.log(JSON.stringify({scope:'same-host cross-process SQLite checkpoint and in-flight cursor only',writerRefusedWhileLocked:true,writerCommittedAfterRelease:true,duplicateReceipts:0,restoredAuthority:false,globalQuiescence:false,offHostProtection:false}));
 }finally{if(child?.pid&&child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');if(exited)await exited;source.store.close();target.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
