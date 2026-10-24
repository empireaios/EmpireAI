import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GovernedCommerceStore,digest} from '../../runtime/commerce-runtime/governed/store.js';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
// @ts-ignore Existing shipped JS control plane.
import {AssuranceControlPlane,inspectControlPlaneMonitor} from '../../assurance/control-plane.mjs';
const workspace='synthetic:work8:storage',now=1800000000000;
function prepared(root:string){const filename=path.join(root,'commerce.sqlite');const store=new GovernedCommerceStore(filename);const worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));const task=worker.enqueue(workspace,'owner','storage-exam');worker.runBounded(workspace,task.id,4);return {store,worker,task,filename};}
test('real truncated journal is contained; explicitly approved isolated backup restoration preserves exact history',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-backup-'));let x=prepared(root);const original=x.store.history(workspace,x.task.mission),expected=digest(original);
 const backup=path.join(root,'backup.sqlite'),restored=path.join(root,'restored.sqlite');
 x.store.db.exec(`VACUUM INTO '${backup}'`);x.store.close();fs.truncateSync(x.filename,0);
 let detected=false;try{new GovernedCommerceStore(x.filename).close();}catch(error){detected=(error as Error).message==='COMMERCE_JOURNAL_CORRUPT';}assert.equal(detected,true);
 let executions=0;
 const cp=new AssuranceControlPlane({root,now:()=>now,revision:'storage-v1',runbooks:{restore:{version:'restore-v1',authority:'B',capability:'journal',maxAttempts:1,cooldownMs:0,timeoutMs:1000,
  execute:()=>{assert.equal(fs.existsSync(restored),false);executions++;fs.copyFileSync(backup,restored,fs.constants.COPYFILE_EXCL);return {target:'isolated-restoration-copy'};},
  verify:()=>{const reader=new GovernedCommerceStore(restored);try{return {healthy:digest(reader.history(workspace,x.task.mission))===expected,observedAt:now};}finally{reader.close();}}}}});
 try{
  const incident=cp.observe(workspace,{id:'truncated-journal',capability:'journal',runbookId:'restore',classification:'DATA_CORRUPTION',status:'FAILED',synthetic:true,summary:'Isolated journal actually truncated',evidence:{sourceBytes:fs.statSync(x.filename).size,expectedDigest:expected}});
  assert.equal((await cp.recover(workspace,incident.id)).status,'OWNER_ACTION_REQUIRED');assert.equal(executions,0);
  const approval=cp.list(workspace,'approval')[0];await cp.command(workspace,'synthetic-owner',{id:'approve-isolated-restore',type:'approve',approvalId:approval.id});
  assert.equal(executions,1);assert.equal(cp.get(workspace,'incident',incident.id).status,'RECOVERED');
  assert.equal(fs.statSync(x.filename).size,0,'original corrupt evidence retained');
  const reader=new GovernedCommerceStore(restored);try{assert.equal(digest(reader.history(workspace,x.task.mission)),expected);assert.equal(reader.history(workspace,x.task.mission).length,4);}finally{reader.close();}
  assert.ok(cp.snapshot(workspace).events.some((e:any)=>e.type==='RECOVERY_RESULT'));
 }finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('corrupt task checkpoint plus lost Assurance heartbeat require two distinct retained incidents',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-compound-'));const x=prepared(root);let clock=now;
 const cp=new AssuranceControlPlane({root,now:()=>clock,revision:'storage-v1'});
 try{
  const original=digest(x.store.history(workspace,x.task.mission));cp.heartbeat(workspace);
  const t=x.worker.get(workspace,x.task.id)!;t.steps=[];
  x.store.db.exec('DROP TRIGGER immutable_commerce_task_plan'); // Deliberate isolated physical corruption.
  x.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(t),workspace,t.id);
  assert.throws(()=>x.worker.tick(workspace,t.id,t.fence),/TASK_CORRUPT/);
  const incident=cp.observe(workspace,{id:'corrupt-checkpoint',capability:'commerce-worker',classification:'DATA_CORRUPTION',status:'FAILED',synthetic:true,summary:'Checkpoint step array removed; authoritative receipt prefix retained',evidence:{historyDigest:original,stepCount:0}});
  clock+=90001;const watchdog=inspectControlPlaneMonitor(cp,workspace);assert.equal(watchdog.fresh,false);
  assert.equal((await cp.recover(workspace,incident.id)).status,'NO_RUNBOOK');
  assert.equal(digest(x.store.history(workspace,x.task.mission)),original);
  assert.equal(cp.list(workspace,'incident').length,2);assert.equal(cp.snapshot(workspace).monitor.fresh,false);
  assert.equal(cp.list(workspace,'incident').filter((i:any)=>!['CLOSED','RECOVERED'].includes(i.status)).length,2);
 }finally{cp.close();x.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('revision rollback keeps new-revision approval fenced and preserves immutable history',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-rollback-'));let executions=0;
 const runbooks={repair:{version:'repair-v2',authority:'B',capability:'cache',maxAttempts:1,cooldownMs:0,timeoutMs:50,execute:()=>{executions++;},verify:()=>({healthy:true})}};
 let cp=new AssuranceControlPlane({root,now:()=>now,revision:'revision-new',runbooks});
 try{
  const incident=cp.observe(workspace,{id:'rollback-fault',capability:'cache',runbookId:'repair',status:'FAILED',synthetic:true,summary:'Explicit isolated rollback scope examination'});await cp.recover(workspace,incident.id);
  const approval=cp.list(workspace,'approval')[0],events=cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all();cp.close();
  cp=new AssuranceControlPlane({root,now:()=>now,revision:'revision-old',runbooks});
  assert.equal(digest(cp.db.prepare('SELECT * FROM cp_events ORDER BY seq').all()),digest(events));
  assert.equal((await cp.command(workspace,'owner',{id:'stale-revision-approval',type:'approve',approvalId:approval.id})).status,'ACTION_DENIED');
  assert.equal((await cp.recover(workspace,incident.id)).status,'REVISION_CHANGED');assert.equal(executions,0);
 }finally{cp.close();fs.rmSync(root,{recursive:true,force:true});}
});

test('forged COMPLETE checkpoint with no receipts is rejected by execution and owner read projections',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-forged-complete-'));const store=new GovernedCommerceStore(path.join(root,'commerce.sqlite'));const worker=new CommerceWorker(new GovernedCommerceEngine(store,()=>now));
 try{const task=worker.enqueue(workspace,'owner','empty-false-complete');task.status='COMPLETE';task.cursor=task.steps.length;task.fence=task.cursor;
  store.db.prepare('UPDATE commerce_runtime_tasks SET record=?,version=? WHERE workspace=? AND id=?').run(JSON.stringify(task),task.fence,workspace,task.id);
  assert.throws(()=>worker.get(workspace,task.id),/TASK_CORRUPT/);assert.throws(()=>worker.runBounded(workspace,task.id),/TASK_CORRUPT/);assert.throws(()=>worker.list(workspace),/TASK_CORRUPT/);
  assert.equal(store.history(workspace,task.mission).length,0);
 }finally{store.close();fs.rmSync(root,{recursive:true,force:true});}
});
test('task plan cannot be truncated after execution; altered committed payload is independently rejected',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-altered-plan-'));const x=prepared(root);
 try{const original=digest(x.store.history(workspace,x.task.mission)),task=x.worker.get(workspace,x.task.id)!;
  const truncated={...task,steps:task.steps.slice(0,task.cursor),status:'COMPLETE'};
  assert.throws(()=>x.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(truncated),workspace,task.id),/IMMUTABLE_TASK_PLAN/);
  // Even physical corruption which bypasses the trigger cannot change committed step identity.
  x.store.db.exec('DROP TRIGGER immutable_commerce_task_plan');
  const altered=structuredClone(task);if(altered.steps[0]!.command.type==='research')altered.steps[0]!.command.candidate.title='Forged replacement source';
  x.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(altered),workspace,task.id);
  assert.throws(()=>x.worker.get(workspace,task.id),/TASK_CORRUPT/);assert.equal(digest(x.store.history(workspace,task.mission)),original);
 }finally{x.store.close();fs.rmSync(root,{recursive:true,force:true});}
});
