import {acceptanceScenario} from '../../runtime/commerce-runtime/governed/scenario.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {GovernedCommerceEngine} from '../../runtime/commerce-runtime/governed/engine.js';
import {digest} from '../../runtime/commerce-runtime/governed/store.js';
import {CommerceWorker} from '../../runtime/commerce-runtime/governed/worker.js';
import {createAssuranceRuntime} from '../../assurance/runtime.js';
import {IntelligenceStore} from '../../intelligence/store.js';
import {RetainedDiscoveryWorker} from '../../runtime/commerce-runtime/governed/work8-source-discovery.js';
import {productionCommerce} from '../../runtime/commerce-runtime/governed/runtime.js';

test('actual AssuranceRuntime cycle repairs registered bounded checkpoint gap without inference or new commerce receipts',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'work8-real-cycle-'));fs.mkdirSync(path.join(root,'commissioning'));
 const previous=process.env.RAILWAY_VOLUME_MOUNT_PATH,previousProfile=process.env.EMPIRE_RUNTIME_PROFILE;process.env.RAILWAY_VOLUME_MOUNT_PATH=root;process.env.EMPIRE_RUNTIME_PROFILE='LOCKED_COMMISSIONING_V1';
 for(const [file,sql] of [['pillow-request-receipts.sqlite','CREATE TABLE receipts(workspace TEXT,request TEXT,body TEXT)'],['pillow-institutional.sqlite','CREATE TABLE records(workspace TEXT,kind TEXT,id TEXT,body TEXT)']]){const db=new DatabaseSync(path.join(root,'commissioning',file!));db.exec(sql!);db.close();}
 const retained=new RetainedDiscoveryWorker(new IntelligenceStore(path.join(root,'commissioning','intelligence.sqlite')));retained.start('ws_empire_1');
 const runtime=await createAssuranceRuntime(root,'work8-runtime-isolated');const commerce=productionCommerce();let inferenceCalls=0;
 runtime.advisor.ports.infer=async()=>{inferenceCalls++;throw Error('NO_INFERENCE_AUTHORITY');};
 try{
  const fixtureEngine=new GovernedCommerceEngine(commerce.store),fixtureWorker=new CommerceWorker(fixtureEngine),task=fixtureWorker.enqueue('ws_empire_1','synthetic-owner','cycle-gap');
  fixtureWorker.runBounded('ws_empire_1',task.id,4);const t=fixtureWorker.get('ws_empire_1',task.id)!,step=t.steps[t.cursor]!;
  fixtureEngine.execute(step.actor,{id:digest({task:task.id,step:t.cursor}),missionId:task.mission,expectedVersion:t.cursor,command:step.command});
  const overdue=acceptanceScenario('ws_empire_1','synthetic-owner',Date.now());overdue.order.createdAt=new Date(Date.now()-9*86400000).toISOString();
  for(const [i,part] of overdue.steps.slice(0,7).entries())fixtureEngine.execute(part.actor,{id:'overdue-'+i,missionId:'overdue-mission',expectedVersion:i,command:part.command});
  const overdueBefore=digest(commerce.store.history('ws_empire_1','overdue-mission'));
  const before=digest(commerce.store.history('ws_empire_1',task.mission));
  await runtime.cycle();if(runtime.advisorWork)await runtime.advisorWork;
  const repair=runtime.control.list('ws_empire_1','recovery').find((r:any)=>r.runbookId==='work8_checkpoint_replay');
  assert.ok(repair,'registered runbook must actually execute via runtime cycle');assert.equal(repair.status,'VERIFIED');
  assert.equal(runtime.control.get('ws_empire_1','probe','work8_read_queue_progress').status,'HEALTHY');assert.equal(runtime.control.get('ws_empire_1','probe','work8_read_queue_progress').runbookId,null);assert.equal(commerce.worker.get('ws_empire_1',task.id)!.cursor,5);assert.equal(digest(commerce.store.history('ws_empire_1',task.mission)),before);assert.equal(inferenceCalls,0);
  const discovery=runtime.control.get('ws_empire_1','probe','retained_product_discovery');assert.equal(discovery.status,'DEGRADED');assert.equal(discovery.evidence.shortfall,100);assert.equal(discovery.evidence.externalRefresh,false);
  const fulfilmentId='work8-fulfilment:'+digest({workspace:'ws_empire_1',missionId:'overdue-mission',orderId:overdue.order.orderId});const fulfilment=runtime.control.get('ws_empire_1','probe',fulfilmentId);assert.equal(fulfilment.status,'FAILED');assert.equal(fulfilment.evidence.reason,'MISSING_TRACKING_OVERDUE');assert.equal(fulfilment.runbookId,null);assert.equal(digest(commerce.store.history('ws_empire_1','overdue-mission')),overdueBefore);const fulfilmentIncident=runtime.control.list('ws_empire_1','incident').find((i:any)=>i.probeId===fulfilmentId);assert.equal(fulfilmentIncident.status,'UNRESOLVED');
  const validCheckpoint=commerce.worker.get('ws_empire_1',task.id)!;
  commerce.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify({...validCheckpoint,status:'COMPLETE'}),'ws_empire_1',task.id);
  await runtime.cycle();const integrity=runtime.control.list('ws_empire_1','incident').find((i:any)=>i.probeId==='work8_checkpoint_integrity');assert.ok(integrity);assert.notEqual(integrity.status,'RECOVERED');
  // Restore retained original checkpoint solely as an isolated owner repair fixture.
  commerce.store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=?').run(JSON.stringify(validCheckpoint),'ws_empire_1',task.id);
  await runtime.cycle();if(runtime.advisorWork)await runtime.advisorWork;
  assert.equal(runtime.control.get('ws_empire_1','incident',integrity.id).status,'RECOVERED');assert.equal(runtime.control.get('ws_empire_1','probe','work8_checkpoint_integrity').status,'HEALTHY');
  assert.equal(runtime.control.list('ws_empire_1','recovery').filter((r:any)=>r.runbookId==='work8_checkpoint_replay').length,1);assert.equal(digest(commerce.store.history('ws_empire_1',task.mission)),before);assert.equal(inferenceCalls,0);
 }finally{runtime.control.close();commerce.store.close();if(previous===undefined)delete process.env.RAILWAY_VOLUME_MOUNT_PATH;else process.env.RAILWAY_VOLUME_MOUNT_PATH=previous;if(previousProfile===undefined)delete process.env.EMPIRE_RUNTIME_PROFILE;else process.env.EMPIRE_RUNTIME_PROFILE=previousProfile;fs.rmSync(root,{recursive:true,force:true});}
});
