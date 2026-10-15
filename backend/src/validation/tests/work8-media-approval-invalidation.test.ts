import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {InstitutionalMemory} from '../../institutional-memory/store.js';import {enforceOwnerSafety} from '../../runtime/commerce-runtime/governed/safety-admission.js';
test('A11 edit and version changes invalidate exact-version approvals with durable history',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'twin-recovery-')),p={workspace:'ws',owner:'owner'},memory=new InstitutionalMemory(path.join(root,'memory.sqlite'));let now=1791676800000;
 memory.ownerCommand(p.workspace,p.owner,{action:'safety_policy',id:'limits',expectedVersion:0,confirmation:true,limits:{currency:'SGD',perOrder:100,daily:1000,aggregate:1000},breakers:{supplierPurchases:false,listingPublication:false,priceInventory:false},reason:'Isolated recovery examination'});
 const open=(file:string)=>{const store=new GovernedCommerceStore(path.join(root,file)),sessions=new Work8TwinSessions(store,()=>now),engine=new GovernedCommerceEngine(store,()=>now,(a,c,s)=>enforceOwnerSafety(memory,store,a,c,s,now,sessions.safetyWorkspace(a.workspace))),worker=new CommerceWorker(engine);return new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));};
 const source=open('source.sqlite');
 try{
 source.sessions.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});source.sessions.transition(p,{id:'resume',sessionId:'exam',expectedVersion:1,action:'RESUME'});
 source.admit(p,{id:'cohort',sessionId:'exam',expectedVersion:2,count:2,authorizeLabelledFixtures:true});source.authority.command(p,{action:'GRANT',id:'grant',sessionId:'exam',expectedVersion:0,mode:'ONE_HOUR'});
 for(let i=0;i<5;i++)source.cycle();

 const reference={sessionId:'exam',missionId:source.projection(p,'exam').records[0]!.missionId,receiptDigest:source.projection(p,'exam').records[0]!.receiptDigest};
 const asset={id:'owner-image',url:'https://example.invalid/owner.png',kind:'IMAGE',sha256:digest('owner-created-test-media'),sourceIdentity:'owner-created-fixture',rightsEvidence:'Owner-created examination fixture',rightsStatus:'OWNER_REVIEWED',provenance:'Test fixture; no publication'};
 const propose=(id:string)=>source.media.command(p,{action:'PROPOSE',id,reference,expectedVersion:source.media.read(p,reference).version,instructions:'Owner revision',assets:[asset],editingReceipt:'owner-fixture'});
 const approve=(action:string,id:string,batchDigest:string|null)=>source.media.command(p,{action,id,reference,expectedVersion:source.media.read(p,reference).version,batchDigest});
 const proposal=propose('first');approve('APPROVE_INTERNAL','internal',proposal.batchDigest);
 assert.throws(()=>source.media.command(p,{action:'APPROVE_INTERNAL',id:'internal',reference,expectedVersion:1,batchDigest:proposal.batchDigest}),/MEDIA_APPROVAL_REPLAY_STALE/);
 const externalRequest={action:'APPROVE_EXTERNAL',id:'external',reference,expectedVersion:2,batchDigest:proposal.batchDigest};
 source.media.command(p,externalRequest);
 assert.throws(()=>source.media.command(p,externalRequest),/MEDIA_APPROVAL_REPLAY_STALE/);
 assert.equal(source.media.read(p,reference).externalStatus,'SIMULATED_SUBMISSION_INTERCEPTED');
 source.media.command(p,{action:'REQUEST_EDIT',id:'edit',reference,expectedVersion:3,instructions:'Change material content',assetIds:[asset.id]});
 assert.throws(()=>approve('APPROVE_EXTERNAL','stale-external',proposal.batchDigest),/MEDIA_(PROPOSAL_STALE|INTERNAL_APPROVAL_REQUIRED)/);
 assert.equal(source.media.read(p,reference).current,null);
 assert.equal(source.media.read(p,reference).externalStatus,'NOT_SUBMITTED');
 assert.throws(()=>approve('APPROVE_INTERNAL','stale-internal',proposal.batchDigest),/MEDIA_PROPOSAL_STALE/);
 assert.throws(()=>source.media.command(p,externalRequest),/MEDIA_APPROVAL_REPLAY_STALE/);
 const revised=propose('revised');
 assert.throws(()=>approve('APPROVE_EXTERNAL','needs-review',revised.batchDigest),/INTERNAL_APPROVAL/);
 approve('APPROVE_INTERNAL','fresh-internal',revised.batchDigest);
 assert.throws(()=>source.media.command(p,{action:'APPROVE_EXTERNAL',id:'mismatch',reference,expectedVersion:6,batchDigest:'0'.repeat(64)}),/PROPOSAL_STALE/);
 approve('APPROVE_EXTERNAL','fresh-external',revised.batchDigest);
 assert.equal(source.media.read(p,reference).externalStatus,'SIMULATED_SUBMISSION_INTERCEPTED');
 assert.throws(()=>approve('APPROVE_EXTERNAL','duplicate-external',revised.batchDigest),/MEDIA_APPROVAL_REPLAY_STALE/);
 const identical=propose('identical-version');
 assert.equal(identical.batchDigest,revised.batchDigest);
 assert.equal(source.media.read(p,reference).current,null);
 assert.equal(source.media.read(p,reference).externalStatus,'NOT_SUBMITTED');
 assert.throws(()=>approve('APPROVE_EXTERNAL','old-version',identical.batchDigest),/INTERNAL_APPROVAL/);
 source.media.command(p,{action:'REQUEST_EDIT',id:'second-edit',reference,expectedVersion:8,instructions:'Withdraw pending revision',assetIds:[asset.id]});
 approve('REJECT','reject-pending-edit',identical.batchDigest);
 assert.throws(()=>approve('APPROVE_INTERNAL','rejected-internal',identical.batchDigest),/PROPOSAL_STALE/);
 const before=source.media.read(p,reference);source.store.close();const reopened=open('source.sqlite');
 try{assert.deepEqual(reopened.media.read(p,reference),before);assert.equal(before.history.length,10);assert.ok(before.history.every(e=>e.externalEffects===0));}finally{reopened.store.close();}
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
