import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {DurableSimulatedFinance} from '../../runtime/commerce-runtime/governed/work8-durable-finance.js';
import {Work8TwinSessions} from '../../runtime/commerce-runtime/governed/work8-twin.js';
import {Work8TwinRuntime} from '../../runtime/commerce-runtime/governed/work8-twin-runtime.js';
test('existing scheduler records bounded advisory without commerce lineage mutation; reconstruction and revocation',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-scheduler-')),file=path.join(root,'commerce.sqlite');let now=Date.parse('2026-10-12T12:00:00Z');const p={workspace:'ws',owner:'owner'};
 const open=()=>{const store=new GovernedCommerceStore(file),sessions=new Work8TwinSessions(store,()=>now),worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now)),finance=new DurableSimulatedFinance(store,worker,()=>now);return {store,sessions,worker,runtime:new Work8TwinRuntime(sessions,worker,finance)};};let c=open();
 const reviews=()=>c.store.db.prepare("SELECT record FROM work8_twin_observations WHERE json_extract(record,'$.kind')='PORTFOLIO_HEALTH_REVIEW' ORDER BY rowid").all().map(r=>JSON.parse(String(r.record)));
 try{
 c.sessions.transition(p,{id:'create',sessionId:'s',expectedVersion:0,action:'CREATE'});c.sessions.transition(p,{id:'resume',sessionId:'s',expectedVersion:1,action:'RESUME'});const admitted=c.runtime.admit(p,{id:'cohort',sessionId:'s',expectedVersion:2,count:2,authorizeLabelledFixtures:true});
 c.runtime.authority.command(p,{action:'GRANT',id:'single',sessionId:'s',expectedVersion:0,mode:'ONE_TASK',taskId:admitted.tasks[0]!.taskId});
 for(let i=0;i<15;i++)c.runtime.cycle();assert.equal(reviews().length,0);
 c.runtime.authority.command(p,{action:'GRANT',id:'all',sessionId:'s',expectedVersion:1,mode:'ONE_HOUR'});
 for(let i=0;i<25;i++)c.runtime.cycle();assert.equal(reviews().length,2);
 const w=c.sessions.read(p,'s').twinWorkspace;assert.ok(c.worker.list(w).every(t=>t.status==='COMPLETE'));
 const histories=digest(c.store.missions(w).map(m=>c.store.history(w,m.missionId))),plans=digest(c.worker.list(w));
 for(const r of reviews()){assert.equal(r.health.score,null);assert.deepEqual(r.health.recommendations,['OBSERVE']);assert.deepEqual(r.evidenceIds,[]);assert.equal(r.grantsAuthority,false);assert.equal(r.receiptDigest,c.store.history(w,r.missionId).at(-1)!.digest);}
 c.store.close();c=open();for(let i=0;i<4;i++)c.runtime.cycle();assert.equal(reviews().length,2);
 now+=300000;for(let i=0;i<4;i++)c.runtime.cycle();assert.equal(reviews().length,4);
 assert.equal(digest(c.store.missions(w).map(m=>c.store.history(w,m.missionId))),histories);assert.equal(digest(c.worker.list(w)),plans);
 const visible=c.runtime.projection(p,'s');assert.ok(visible.assurance.observations.some(o=>o.kind==='PORTFOLIO_HEALTH_REVIEW'));assert.throws(()=>c.runtime.projection({...p,owner:'foreign'},'s'),/OWNER/);
 c.runtime.authority.command(p,{action:'REVOKE',id:'stop',sessionId:'s',expectedVersion:2});now+=300000;for(let i=0;i<4;i++)c.runtime.cycle();assert.equal(reviews().length,4);
 }finally{c.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
