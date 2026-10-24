import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {GovernedCommerceStore} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
// Predeclared oracle: all eight categories remain simulated; high-risk/explicit
// escalation cannot disappear on benign follow-up, and pending deadlines cannot
// be extended by a new message. Owner resolution is the explicit clearing event.
test('communication risk, pending deadlines and escalation survive benign follow-ups and restart',()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-communication-')),p={workspace:'ws',owner:'owner'};let now=1791676800000;
 const open=()=>{const store=new GovernedCommerceStore(path.join(root,'state.sqlite')),sessions=new Work8TwinSessions(store,()=>now),worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));return new Work8TwinRuntime(sessions,worker,new DurableSimulatedFinance(store,worker,()=>now));};let runtime=open();
 try{
 runtime.sessions.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});const w=runtime.sessions.read(p,'exam').twinWorkspace,f=acceptanceScenario(w,p.owner,now);
 const receipt=runtime.worker.engine.execute(f.steps[0]!.actor,{id:'seed',missionId:'fixture:product',expectedVersion:0,command:f.steps[0]!.command});
 const reference={sessionId:'exam',missionId:receipt.missionId,receiptDigest:receipt.digest};
 const categories=['PRODUCT_INQUIRY','SHIPPING_QUESTION','COMPLAINT','RETURN_REFUND','HOSTILE_EXCHANGE','CHARGEBACK_DISPUTE','SELLER_PERFORMANCE','UNANSWERABLE'];
 for(const [i,category]of categories.entries()){
 const intake=runtime.communications.command(p,{id:'intake-'+i,reference,threadId:'thread-'+i,expectedVersion:0,action:'RECEIVE',category,message:'Synthetic communication scenario',deadlineAt:now+1000});
 assert.equal(intake.externalEffects,0);assert.equal(intake.risk,i>=5?'HIGH':i>=2?'ELEVATED':'NORMAL');
 const draft=runtime.communications.command(p,{id:'draft-'+i,reference,threadId:'thread-'+i,expectedVersion:1,action:'PREPARE'});
 assert.equal(draft.modelAssessment,'NOT_REQUESTED');assert.match(draft.draft!,/No delivery date, compensation, refund or policy exception has been authorised/);
 }
 const follow={id:'benign-followup',reference,threadId:'thread-5',expectedVersion:2,action:'RECEIVE',category:'PRODUCT_INQUIRY',message:'Thank you',deadlineAt:now+99999};
 const saved=runtime.communications.command(p,follow);assert.equal(saved.risk,'HIGH');assert.equal(saved.status,'OWNER_ESCALATION');assert.equal(saved.deadlineAt,now+1000);assert.equal(runtime.communications.command(p,follow).digest,saved.digest);
 assert.throws(()=>runtime.communications.command(p,{...follow,id:'stale'}),/VERSION_CONFLICT/);
 runtime.communications.command(p,{id:'escalate',reference,threadId:'thread-0',expectedVersion:2,action:'ESCALATE'});
 assert.equal(runtime.communications.command(p,{id:'after-escalation',reference,threadId:'thread-0',expectedVersion:3,action:'PREPARE'}).status,'OWNER_ESCALATION');
 const hostile=runtime.communications.command(p,{id:'repeat-hostility',reference,threadId:'thread-4',expectedVersion:2,action:'RECEIVE',category:'HOSTILE_EXCHANGE',message:'Second synthetic hostile message'});assert.equal(hostile.risk,'HIGH');
 now+=1001;const overdue=runtime.communications.command(p,{id:'overdue-draft',reference,threadId:'thread-1',expectedVersion:2,action:'PREPARE'});assert.equal(overdue.status,'OWNER_ESCALATION');
 const before=runtime.communications.read(p,'exam');assert.equal(before.length,8);assert.ok(before.every(t=>t.overdue));runtime.store.close();runtime=open();assert.deepEqual(runtime.communications.read(p,'exam'),before);
 runtime.communications.command(p,{id:'resolve',reference,threadId:'thread-5',expectedVersion:3,action:'RESOLVE'});assert.equal(runtime.communications.read(p,'exam').find(t=>t.threadId==='thread-5')!.overdue,false);
 assert.throws(()=>runtime.communications.command({...p,owner:'other'},{...follow,id:'foreign'}),/OWNER_SCOPE/);
 assert.equal(runtime.store.history(w,receipt.missionId).length,1);
 }finally{runtime.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
