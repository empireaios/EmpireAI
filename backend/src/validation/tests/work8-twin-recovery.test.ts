import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {captureTwinCheckpoint,initializeTwinRecoveryTarget,replayTwinCheckpoint,saveTwinCheckpoint,readTwinCheckpoint} from '../../runtime/commerce-runtime/governed/work8-twin-recovery.js';
import {InstitutionalMemory} from '../../institutional-memory/store.js';import {enforceOwnerSafety} from '../../runtime/commerce-runtime/governed/safety-admission.js';
test('versioned twin snapshot, ordered catch-up, immutable vault and no restored authority',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'twin-recovery-')),p={workspace:'ws',owner:'owner'},memory=new InstitutionalMemory(path.join(root,'memory.sqlite'));let now=1791676800000;
 memory.ownerCommand(p.workspace,p.owner,{action:'safety_policy',id:'limits',expectedVersion:0,confirmation:true,limits:{currency:'SGD',perOrder:100,daily:1000,aggregate:1000},breakers:{supplierPurchases:false,listingPublication:false,priceInventory:false},reason:'Isolated recovery examination'});
 const open=(file:string)=>{const store=new GovernedCommerceStore(path.join(root,file)),sessions=new Work8TwinSessions(store,()=>now),engine=new GovernedCommerceEngine(store,()=>now,(a,c,s)=>enforceOwnerSafety(memory,store,a,c,s,now,sessions.safetyWorkspace(a.workspace))),worker=new CommerceWorker(engine);return new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));};
 const source=open('source.sqlite'),target=open('target.sqlite');
 try{
 source.sessions.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});source.sessions.transition(p,{id:'resume',sessionId:'exam',expectedVersion:1,action:'RESUME'});
 source.admit(p,{id:'cohort',sessionId:'exam',expectedVersion:2,count:2,authorizeLabelledFixtures:true});source.authority.command(p,{action:'GRANT',id:'grant',sessionId:'exam',expectedVersion:0,mode:'ONE_HOUR'});
 for(let i=0;i<5;i++)source.cycle();
 const version={applicationRevision:'a'.repeat(40),configurationDigest:digest({isolated:true})};
 const first=captureTwinCheckpoint(source,p,'exam',version);
 assert.throws(()=>initializeTwinRecoveryTarget(source.store),/NOT_EMPTY/);
 initializeTwinRecoveryTarget(target.store);
 const vault=path.join(root,'vault');fs.mkdirSync(vault);saveTwinCheckpoint(vault,first);assert.throws(()=>saveTwinCheckpoint(vault,first),/EEXIST/);
 assert.deepEqual(readTwinCheckpoint(vault,first.digest),first);
 assert.equal(replayTwinCheckpoint(target,first,first.digest).status,'APPLIED');
 assert.equal(replayTwinCheckpoint(target,first,first.digest).status,'ALREADY_APPLIED');
 assert.deepEqual(target.projection(p,'exam').records,source.projection(p,'exam').records);
 assert.notEqual(target.authority.read(p,'exam').status,'ACTIVE');assert.equal(target.cycle().status,'BLOCKED');
 for(let i=0;i<40;i++)source.cycle();now+=86460000;source.authority.command(p,{action:'GRANT',id:'settle',sessionId:'exam',expectedVersion:1,mode:'ONE_HOUR'});for(let i=0;i<20;i++)source.cycle();
 const second=captureTwinCheckpoint(source,p,'exam',{...version,applicationRevision:'b'.repeat(40)},first);
 assert.equal(source.projection(p,'exam').records.length,2);assert.ok(source.projection(p,'exam').records.every(r=>r.finance.status==='COMPLETE_SIMULATION'));
 // Scheduler observation made in the target is an experiment; immutable source
 // observations can coexist, but canonical business records must remain equal.
 replayTwinCheckpoint(target,second,second.digest);
 assert.deepEqual(target.projection(p,'exam').records,source.projection(p,'exam').records);
 assert.equal(target.store.db.prepare('SELECT count(*) n FROM work8_sim_finance_events').get()?.n,22);
 assert.throws(()=>replayTwinCheckpoint(target,first,first.digest),/REPLAY_ORDER/);
 assert.throws(()=>replayTwinCheckpoint(target,{...second,owner:'foreign'},second.digest),/INTEGRITY/);
 assert.throws(()=>captureTwinCheckpoint(source,{...p,owner:'foreign'},'exam',version),/OWNER_SCOPE/);
 const recordDigest=digest(target.projection(p,'exam').records);
 // Code/configuration reference may return to older revision; business history
 // still extends the latest checkpoint and cannot revert to the older snapshot.
 const third=captureTwinCheckpoint(source,p,'exam',version,second);replayTwinCheckpoint(target,third,third.digest);
 assert.equal(digest(target.projection(p,'exam').records),recordDigest);
 console.log(JSON.stringify({scope:'Canonical isolated snapshot and replay; application references only, no deployed upgrade claimed',orders:2,financialEvents:22,authorityRestored:false}));
 }finally{source.store.close();target.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
