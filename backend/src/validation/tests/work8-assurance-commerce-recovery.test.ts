import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {makeWork8CommerceRecovery} from '../../assurance/work8-commerce-recovery.js';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
// @ts-ignore Shipped JS engine.
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';
const now=1800000000000,ws='synthetic:work8:bounded-replay';
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-bounded-replay-'));const store=new GovernedCommerceStore(path.join(root,'commerce.sqlite')),engine=new GovernedCommerceEngine(store,()=>now),worker=new CommerceWorker(engine);const task=worker.enqueue(ws,'owner','replay');const helper=makeWork8CommerceRecovery({store,worker,now:()=>now});return {root,store,engine,worker,task,helper,close(){store.close();fs.rmSync(root,{recursive:true,force:true});}};}
function crash(x:ReturnType<typeof fixture>,cursor=4){x.worker.runBounded(ws,x.task.id,cursor);const t=x.worker.get(ws,x.task.id)!,step=t.steps[t.cursor]!;x.engine.execute(step.actor,{id:digest({task:t.id,step:t.cursor}),missionId:t.mission,expectedVersion:t.cursor,command:step.command});return t;}
test('candidate runbook repairs only real committed receipt checkpoint gap and independently preserves history',async()=>{const x=fixture();const cp=new AssuranceControlPlane({root:x.root,now:()=>now,revision:'w8-test',runbooks:{work8_checkpoint_replay:x.helper.runbook}});try{const task=crash(x),before=digest(x.store.history(ws,task.mission)),probe=x.helper.probes(ws)[0]!;const incident=cp.observe(ws,probe);const result=await cp.recover(ws,incident.id);assert.equal(result.status,'VERIFIED');assert.equal(x.worker.get(ws,task.id)!.cursor,5);assert.equal(digest(x.store.history(ws,task.mission)),before);assert.equal((await cp.recover(ws,incident.id)).status,'NOT_ELIGIBLE');assert.equal(x.store.history(ws,task.mission).length,5);}finally{cp.close();x.close();}});
test('normal task with no committed gap cannot execute a fresh step through recovery',()=>{const x=fixture();try{assert.equal(x.helper.probes(ws).length,0);assert.throws(()=>x.helper.runbook.execute({workspace:ws,incident:{probeId:'work8-checkpoint:'+digest({workspace:ws,id:x.task.id})}}),/REPLAY_NOT_REQUIRED/);assert.equal(x.store.history(ws,x.task.mission).length,0);}finally{x.close();}});
test('altered committed step payload cannot be used as replay authority',()=>{const x=fixture();try{const t=crash(x);x.store.db.exec('DROP TRIGGER immutable_commerce_task_plan');const corrupted=x.worker.get(ws,t.id)!;if(corrupted.steps[4]!.command.type==='intake')corrupted.steps[4]!.command.paymentEvidence='forged-evidence';x.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(corrupted),ws,t.id);assert.throws(()=>x.helper.probes(ws),/TASK_CORRUPT/);assert.equal(x.store.history(ws,t.mission).length,5);}finally{x.close();}});
test('unknown supplier outcome cannot be relabelled as safe checkpoint recovery',()=>{const x=fixture();try{const task=x.worker.get(ws,x.task.id)!;const step=task.steps.find(s=>s.command.type==='intercept')!;if(step.command.type==='intercept'){step.command.result='TIMEOUT';step.command.acceptedQuantity=0;}x.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(task),ws,task.id);x.worker.runBounded(ws,task.id,4);x.worker.runBounded(ws,task.id,2);const t=x.worker.get(ws,task.id)!,intercept=t.steps[t.cursor]!;x.engine.execute(intercept.actor,{id:digest({task:t.id,step:t.cursor}),missionId:t.mission,expectedVersion:t.cursor,command:intercept.command});const probe=x.helper.probes(ws)[0]!;assert.equal(probe.status,'BLOCKED');assert.equal(probe.runbookId,null);assert.throws(()=>x.helper.runbook.execute({workspace:ws,incident:{probeId:probe.id}}),/CHECKPOINT_UNCERTAIN_COMMERCE/);assert.equal(x.worker.get(ws,task.id)!.cursor,6);assert.equal(x.store.history(ws,task.mission).length,7);}finally{x.close();}});

test('fresh aligned observation closes a gap when normal worker wins race without extra recovery effect',async()=>{
 const x=fixture();let observedAt=now;const helper=makeWork8CommerceRecovery({store:x.store,worker:x.worker,now:()=>observedAt});const cp=new AssuranceControlPlane({root:x.root,now:()=>observedAt,revision:'w8-race',runbooks:{work8_checkpoint_replay:helper.runbook}});
 try{const task=crash(x),probe=helper.probes(ws)[0]!,incident=cp.observe(ws,probe),original=digest(x.store.history(ws,task.mission));
  x.worker.tick(ws,task.id,task.fence);observedAt+=1000;
  const healthy=helper.probes(ws).find(p=>p.id===probe.id)!;assert.equal(healthy.status,'HEALTHY');assert.equal(healthy.evidence.observedAt,observedAt);cp.observe(ws,healthy);
  assert.equal(cp.get(ws,'incident',incident.id).status,'RECOVERED');assert.equal((await cp.recover(ws,incident.id)).status,'NOT_ELIGIBLE');assert.equal(cp.list(ws,'recovery').length,0);assert.equal(digest(x.store.history(ws,task.mission)),original);assert.equal(x.worker.get(ws,task.id)!.cursor,5);
 }finally{cp.close();x.close();}
});
