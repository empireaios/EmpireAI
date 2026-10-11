import Fastify from 'fastify';
import {registerWork8TwinRoutes} from '../../runtime/commerce-runtime/governed/work8-twin-routes.js';
import {createAuthMiddleware} from '../../auth/middleware.js';
import {InMemorySessionStore} from '../../auth/session-store.js';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime,startTwinScheduler} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
import {InstitutionalMemory} from '../../institutional-memory/store.js';
import {enforceOwnerSafety} from '../../runtime/commerce-runtime/governed/safety-admission.js';

test('persistent vertical twin: multiple products, actual scheduler, checkpoint fault recovery, shipments, settlement and restart equality',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'twin-vertical-')),file=path.join(root,'commerce.sqlite');let now=Date.parse('2026-10-11T00:00:00Z');
 const p={workspace:'ws',owner:'owner'},memory=new InstitutionalMemory(path.join(root,'memory.sqlite'));
 memory.ownerCommand(p.workspace,p.owner,{action:'safety_policy',id:'limits',expectedVersion:0,confirmation:true,limits:{currency:'SGD',perOrder:100,daily:1000,aggregate:1000},breakers:{supplierPurchases:false,listingPublication:false,priceInventory:false},reason:'Explicit bounded synthetic examination only'});
 const open=()=>{const store=new GovernedCommerceStore(file),sessions=new Work8TwinSessions(store,()=>now),engine=new GovernedCommerceEngine(store,()=>now,(a,c,s)=>enforceOwnerSafety(memory,store,a,c,s,now,sessions.safetyWorkspace(a.workspace))),worker=new CommerceWorker(engine),finance=new DurableSimulatedFinance(store,worker,()=>now);return {store,sessions,worker,finance,runtime:new Work8TwinRuntime(sessions,worker,finance)};};
 let c=open(),stop=()=>{};const waitFor=async(check:()=>boolean)=>{const deadline=Date.now()+10000;while(!check()){if(Date.now()>deadline)throw Error('SCHEDULER_EXAM_TIMEOUT');await new Promise(resolve=>setTimeout(resolve,20));}};try{
  c.sessions.transition(p,{id:'create',sessionId:'exam',expectedVersion:0,action:'CREATE'});c.sessions.transition(p,{id:'resume',sessionId:'exam',expectedVersion:1,action:'RESUME'});
  const admission={id:'cohort',sessionId:'exam',expectedVersion:2,count:3,authorizeLabelledFixtures:true};
  const admitted=c.runtime.admit(p,admission);assert.deepEqual(c.runtime.admit(p,admission),admitted);
  c.runtime.inject(p,{id:'gap',sessionId:'exam',expectedVersion:2,kind:'COMMITTED_RECEIPT_CURSOR_GAP'});
  const before=c.runtime.projection(p,'exam');assert.equal(before.assurance.probes[0]?.status,'FAILED');
  c.runtime.cycle();const recovered=c.runtime.projection(p,'exam');assert.ok(recovered.assurance.observations.some(o=>o.kind==='ASSURANCE_RECOVERED'));
  c.sessions.transition(p,{id:'pause',sessionId:'exam',expectedVersion:2,action:'PAUSE'});
  const frozen=digest(c.runtime.projection(p,'exam'));assert.equal(c.runtime.cycle().status,'IDLE');assert.equal(digest(c.runtime.projection(p,'exam')),frozen);
  c.store.close();c=open();assert.equal(digest(c.runtime.projection(p,'exam')),frozen);
  c.sessions.transition(p,{id:'resume-again',sessionId:'exam',expectedVersion:3,action:'RESUME'});
  stop=startTwinScheduler(()=>c.runtime,10);await waitFor(()=>c.worker.list(c.sessions.read(p,'exam').twinWorkspace).every(t=>t.status==='COMPLETE'));stop();
  let view=c.runtime.projection(p,'exam');assert.equal(view.records.length,3);assert.equal(new Set(view.records.map(r=>r.productId)).size,3);
  assert.ok(view.tasks.every(t=>t.status==='COMPLETE'),JSON.stringify(view.tasks.map(t=>({status:t.status,error:t.error}))));
  assert.ok(view.records.every(r=>r.publication?.status==='INTERCEPTED'&&Object.values(r.orders).every(o=>o.outcome==='DELIVERED')));
  now+=86460000;stop=startTwinScheduler(()=>c.runtime,10);await waitFor(()=>c.runtime.projection(p,'exam').records.every(r=>r.finance.status==='COMPLETE_SIMULATION'));stop();
  view=c.runtime.projection(p,'exam');assert.ok(view.records.every(r=>r.finance.status==='COMPLETE_SIMULATION'),JSON.stringify(view.records.map(r=>r.finance)));
  assert.ok(view.records.every(r=>r.finance.actualCashMovement===0&&r.sourceClassification==='SYNTHETIC'));
  const w=view.session.twinWorkspace,counts=()=>[c.store.db.prepare('SELECT count(*) n FROM commerce_runtime_receipts WHERE workspace=?').get(w)?.n,c.store.db.prepare('SELECT count(*) n FROM work8_sim_finance_events WHERE workspace=?').get(w)?.n];
  const conserved=counts();c.store.close();c=open();for(let i=0;i<10;i++)c.runtime.cycle();assert.deepEqual(counts(),conserved);
  assert.ok(view.records.every(r=>r.finance.financial?.conserved===true));
  for(const r of view.records){const events=r.finance.events;assert.equal(events.find(e=>e.kind==='SALE')?.minor,8000);assert.equal(events.find(e=>e.kind==='COGS')?.minor,1600);assert.equal(events.find(e=>e.kind==='FREIGHT')?.minor,600);assert.equal(events.find(e=>e.kind==='FEE')?.minor,1360);assert.equal(events.find(e=>e.kind==='DUTY')?.minor,400);assert.equal(events.find(e=>e.kind==='BANK_RECEIPT')?.minor,6640);}
  const http=Fastify(),auth=new InMemorySessionStore();const fixtureSession=await auth.create({id:p.owner,workspaceId:p.workspace,role:'founder',email:'fixture@example.invalid',name:'Synthetic HTTP test'});
  registerWork8TwinRoutes(http,{authenticate:createAuthMiddleware(auth),owner:async(req,reply)=>{if(req.user?.id!==p.owner||req.user.workspaceId!==p.workspace)return reply.code(403).send({error:'Owner access required'});},sessions:()=>c.sessions,projection:(p,s,a,l)=>c.runtime.projection(p,s,a,l)});
  try{assert.equal((await http.inject({url:'/api/owner/commerce/twin?sessionId=exam'})).statusCode,401);const result=await http.inject({url:'/api/owner/commerce/twin?sessionId=exam',headers:{authorization:'Bearer '+fixtureSession.token}});assert.equal(result.statusCode,200);assert.equal(digest(result.json().records),digest(view.records));}finally{await http.close();}
  if(process.env.WORK8_EVIDENCE_PATH)fs.writeFileSync(process.env.WORK8_EVIDENCE_PATH,JSON.stringify({schema:'WORK8_TWIN_VERTICAL_EXAM',classification:'LABELLED_FIXTURE_EXAMINATION',view,counts:conserved,checks:{distinctProducts:3,deliveredOrders:3,settlementComplete:true,checkpointRecovery:true,pauseFreeze:true,coldRestartNoDuplicates:true,actualCashMovement:0}},null,2));
  assert.equal(c.store.missions(p.workspace).length,0);assert.throws(()=>c.runtime.projection({...p,owner:'other'},'exam'),/OWNER/);
 }finally{stop();c.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
