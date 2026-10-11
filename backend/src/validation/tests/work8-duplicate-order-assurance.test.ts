import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
// @ts-ignore Canonical JavaScript control plane.
import {AssuranceControlPlane} from '../../assurance/control-plane.mjs';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine,type CommerceState} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {makeWork8CommerceRecovery} from '../../assurance/work8-commerce-recovery.js';
test('queue-origin duplicate intake blocks durably and Assurance cannot replay or erase the incident',async()=>{
 assert.equal(process.env.WORK8_KERNEL_EGRESS,'DENIED');const root=fs.mkdtempSync(path.join(os.tmpdir(),'duplicate-assurance-')),file=path.join(root,'commerce.sqlite'),workspace='synthetic:duplicate-order';
 let store=new GovernedCommerceStore(file),worker=new CommerceWorker(new GovernedCommerceEngine(store));
 const cp=new AssuranceControlPlane({root,revision:'work8-duplicate-exam',runbooks:{}});
 try{
  const task=worker.enqueue(workspace,'fixture-owner','duplicate');task.steps=task.steps.slice(0,5);task.steps.push(structuredClone(task.steps[4]!));
  store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(task),workspace,task.id);
  worker.runBounded(workspace,task.id);worker.runBounded(workspace,task.id);
  assert.equal(worker.get(workspace,task.id)?.error,'DUPLICATE_ORDER');assert.equal(worker.get(workspace,task.id)?.status,'BLOCKED');
  const history=store.history(workspace,task.mission),before=digest(history);assert.equal(history.length,5);assert.equal(Object.keys((history.at(-1)!.state as unknown as CommerceState).orders).length,1);
  const probe=makeWork8CommerceRecovery({store,worker}).probes(workspace,task.id)[0]!;assert.equal(probe.status,'BLOCKED');assert.equal(probe.runbookId,null);
  const incident=cp.observe(workspace,{...probe,synthetic:true,status:'FAILED',classification:'DUPLICATE_ORDER_INTAKE',evidence:{...probe.evidence,detector:worker.get(workspace,task.id)?.error}});
  assert.equal((await cp.recover(workspace,incident.id)).status,'NO_RUNBOOK');assert.equal(cp.get(workspace,'incident',incident.id).status,'UNRESOLVED');
  store.close();store=new GovernedCommerceStore(file);worker=new CommerceWorker(new GovernedCommerceEngine(store));
  assert.throws(()=>worker.tick(workspace,task.id,worker.get(workspace,task.id)!.fence),/TASK_BLOCKED_REVIEW_REQUIRED/);
  assert.equal(digest(store.history(workspace,task.mission)),before);assert.equal(makeWork8CommerceRecovery({store,worker}).probes(workspace,task.id)[0]!.status,'BLOCKED');assert.ok(cp.list(workspace,'incident').some((r:{id:string})=>r.id===incident.id));
  assert.ok(history.every(r=>r.externalEffects===0));
 }finally{cp.close();store.close();fs.rmSync(root,{recursive:true,force:true});}
});
