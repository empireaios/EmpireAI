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

 const scope='UX_CHANGE_PREPARATION';
 const grant=source.preparation.command(p,{action:'GRANT',id:'ux-grant',sessionId:'exam',scope,expectedVersion:0,mode:'ONE_TASK',taskId:'green-preview'});
 assert.throws(()=>source.preparation.prepare(p,{id:'wrong-task',sessionId:'exam',scope,grantDigest:grant.digest,color:'GREEN'}),/AUTHORITY_DENIED/);
 const prepared=source.preparation.prepare(p,{id:'green-preview',sessionId:'exam',scope,grantDigest:grant.digest,color:'GREEN'});assert.equal(prepared.result?.productionChange,false);assert.equal(prepared.result?.background,'#e8f5ed');assert.equal(source.preparation.read(p,'exam',scope).status,'CONSUMED');
 const approved=source.preparation.command(p,{action:'APPROVE_PREVIEW',id:'approve-green',sessionId:'exam',scope,expectedVersion:2,proposalDigest:prepared.digest});assert.equal(approved.result?.ownerApproved,true);assert.equal(approved.result?.deploymentAuthorized,false);
 assert.equal(source.preparation.prepare(p,{id:'green-preview',sessionId:'exam',scope,grantDigest:grant.digest,color:'GREEN'}).digest,prepared.digest);
 assert.throws(()=>source.preparation.command(p,{action:'GRANT',id:'live-grant',sessionId:'exam',scope:'LIVE_COMMERCE',expectedVersion:0,mode:'ONE_HOUR'}));
 source.preparation.command(p,{action:'GRANT',id:'research-grant',sessionId:'exam',scope:'RESEARCH_REASONING',expectedVersion:0,mode:'FIFTEEN_MINUTES'});
 const inspectGrant=source.preparation.command(p,{action:'GRANT',id:'inspect-grant',sessionId:'exam',scope:'BACKEND_READ_ONLY',expectedVersion:0,mode:'FIFTEEN_MINUTES'});
 source.preparation.command(p,{action:'REVOKE',id:'inspect-revoke',sessionId:'exam',scope:'BACKEND_READ_ONLY',expectedVersion:1});
 assert.throws(()=>source.preparation.prepare(p,{id:'inspect',sessionId:'exam',scope:'BACKEND_READ_ONLY',grantDigest:inspectGrant.digest}),/AUTHORITY_DENIED/);
 const version={applicationRevision:'a'.repeat(40),configurationDigest:digest({isolated:true})};

 const reference={sessionId:'exam',missionId:source.projection(p,'exam').records[0]!.missionId,receiptDigest:source.projection(p,'exam').records[0]!.receiptDigest};
 const intake={id:'inquiry',reference,threadId:'normal',expectedVersion:0,action:'RECEIVE',category:'PRODUCT_INQUIRY',message:'What size is it?',deadlineAt:now+1000};
 assert.equal(source.communications.command(p,intake).risk,'NORMAL');assert.equal(source.communications.command(p,intake).version,1);
 source.communications.command(p,{id:'draft',reference,threadId:'normal',expectedVersion:1,action:'PREPARE'});
 const high=source.communications.command(p,{...intake,id:'adverse',threadId:'adverse',category:'CHARGEBACK_DISPUTE'});assert.equal(high.status,'OWNER_ESCALATION');
 assert.throws(()=>source.communications.command(p,{...intake,id:'forged',reference:{...reference,receiptDigest:'0'.repeat(64)}}),/STALE/);
 assert.throws(()=>source.communications.command({...p,owner:'foreign'},intake),/OWNER_SCOPE/);
 assert.equal(source.communications.read(p,'exam')[0]!.risk,'HIGH');

 const asset={id:'fixture-image',url:'https://example.invalid/revised.png',kind:'IMAGE',sha256:digest('labelled-fixture'),sourceIdentity:'fixture-source',rightsEvidence:'Synthetic examination only; no licensed media claimed',rightsStatus:'UNVERIFIED',provenance:'Test metadata, no image editing performed'};
 const proposal=source.media.command(p,{action:'PROPOSE',id:'media-one',reference,expectedVersion:0,instructions:'Labelled editing fixture',assets:[asset],editingReceipt:'fixture-not-provider-receipt'});
 assert.throws(()=>source.media.command(p,{action:'APPROVE_INTERNAL',id:'bad-rights',reference,expectedVersion:1,batchDigest:proposal.batchDigest}),/RIGHTS/);
 const revised=source.media.command(p,{action:'PROPOSE',id:'media-two',reference,expectedVersion:1,instructions:'Reviewed fixture rights boundary',assets:[{...asset,rightsStatus:'OWNER_REVIEWED'}],editingReceipt:'fixture-not-provider-receipt'});
 assert.throws(()=>source.media.command(p,{action:'APPROVE_EXTERNAL',id:'no-internal',reference,expectedVersion:2,batchDigest:revised.batchDigest}),/INTERNAL_APPROVAL/);
 source.media.command(p,{action:'APPROVE_INTERNAL',id:'internal',reference,expectedVersion:2,batchDigest:revised.batchDigest});
 source.media.command(p,{action:'APPROVE_EXTERNAL',id:'external',reference,expectedVersion:3,batchDigest:revised.batchDigest});
 assert.equal(source.media.read(p,reference).externalStatus,'SIMULATED_SUBMISSION_INTERCEPTED');
 source.media.command(p,{action:'PROPOSE',id:'media-three',reference,expectedVersion:4,instructions:'Later fixture edit invalidates submission',assets:[{...asset,rightsStatus:'OWNER_REVIEWED'}],editingReceipt:'fixture-not-provider-receipt'});
 assert.equal(source.media.read(p,reference).externalStatus,'NOT_SUBMITTED');
 assert.throws(()=>source.media.command(p,{action:'APPROVE_EXTERNAL',id:'stale-media',reference,expectedVersion:5,batchDigest:revised.batchDigest}),/PROPOSAL_STALE/);
 source.store.db.exec("CREATE TABLE protected_live_record(value TEXT);INSERT INTO protected_live_record VALUES('NEVER_COPY_PRODUCTION_SECRET')");
 const first=captureTwinCheckpoint(source,p,'exam',version);
 assert.equal(JSON.stringify(first).includes('NEVER_COPY_PRODUCTION_SECRET'),false);
 assert.throws(()=>initializeTwinRecoveryTarget(source.store),/NOT_EMPTY/);
 initializeTwinRecoveryTarget(target.store);
 const vault=path.join(root,'vault');fs.mkdirSync(vault);saveTwinCheckpoint(vault,first);assert.throws(()=>saveTwinCheckpoint(vault,first),/EEXIST/);
 assert.deepEqual(readTwinCheckpoint(vault,first.digest),first);
 assert.equal(replayTwinCheckpoint(target,first,first.digest).status,'APPLIED');
 assert.equal(replayTwinCheckpoint(target,first,first.digest).status,'ALREADY_APPLIED');
 assert.deepEqual(target.projection(p,'exam').records,source.projection(p,'exam').records);
 assert.deepEqual(target.communications.read(p,'exam'),source.communications.read(p,'exam'));
 assert.ok(target.preparation.all(p,'exam').every(g=>g.status==='NOT_GRANTED'));
 assert.notEqual(target.authority.read(p,'exam').status,'ACTIVE');assert.throws(()=>target.authority.require(p,'exam'),/NOT_GRANTED/);
 for(let i=0;i<40;i++)source.cycle();now+=86460000;source.authority.command(p,{action:'GRANT',id:'settle',sessionId:'exam',expectedVersion:1,mode:'ONE_HOUR'});for(let i=0;i<20;i++)source.cycle();
 assert.equal(source.preparation.read(p,'exam','RESEARCH_REASONING').status,'EXPIRED');
 const second=captureTwinCheckpoint(source,p,'exam',{...version,applicationRevision:'b'.repeat(40)},first);
 assert.equal(source.projection(p,'exam').records.length,2);assert.ok(source.projection(p,'exam').records.every(r=>r.finance.status==='COMPLETE_SIMULATION'));
 // Replay requires unchanged isolated target business history.
 replayTwinCheckpoint(target,second,second.digest);
 assert.deepEqual(target.projection(p,'exam').records,source.projection(p,'exam').records);
 assert.deepEqual(target.communications.read(p,'exam'),source.communications.read(p,'exam'));
 assert.equal(target.store.db.prepare('SELECT count(*) n FROM work8_sim_finance_events').get()?.n,22);
 assert.throws(()=>replayTwinCheckpoint(target,first,first.digest),/REPLAY_ORDER/);
 assert.throws(()=>replayTwinCheckpoint(target,{...second,owner:'foreign'},second.digest),/INTEGRITY/);
 assert.throws(()=>captureTwinCheckpoint(source,{...p,owner:'foreign'},'exam',version),/OWNER_SCOPE/);
 const recordDigest=digest(target.projection(p,'exam').records);
 // Code/configuration reference may return to older revision; business history
 // still extends the latest checkpoint and cannot revert to the older snapshot.
 const third=captureTwinCheckpoint(source,p,'exam',version,second);replayTwinCheckpoint(target,third,third.digest);
 assert.equal(digest(target.projection(p,'exam').records),recordDigest);
 target.cycle();
 const fourth=captureTwinCheckpoint(source,p,'exam',version,third);
 assert.throws(()=>replayTwinCheckpoint(target,fourth,fourth.digest),/TARGET_DIVERGED/);
 assert.equal(source.store.db.prepare('SELECT value FROM protected_live_record').get()?.value,'NEVER_COPY_PRODUCTION_SECRET');
 console.log(JSON.stringify({scope:'Canonical isolated snapshot and replay; application references only, no deployed upgrade claimed',orders:2,financialEvents:22,authorityRestored:false}));
 }finally{source.store.close();target.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
