import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';

// Independent read-only process: no application imports, write calls or raw DB export.
const sha=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const control=process.env.WORK8_CONTROL_DIR??'/control',evidence=process.env.WORK8_EVIDENCE_DIR??'/evidence';
const phase=['normal','recovery','final'].includes(process.argv[2])?process.argv[2]:'invalid';
const database=process.env.WORK8_READBACK_DATABASE??'/data/work8-exam/native-transition/volume/commerce/runtime.sqlite';
let db,expected,snapshot,session;
const receipt={schema:'work8-native-commerce-independent-readback-v2',status:'FAIL',readerProcess:process.pid,phase,readOnlySqlite:true,productionData:false,rawDatabaseExported:false,wholeRowsAccepted:[]};
const signatures=[];
let stage='INPUT_CANONICAL_EXPECTATION';
function read(table,sql,...bindings){
 const rows=db.prepare(sql).all(...bindings);assert.ok(rows.length<=1024,'COMMERCE_READBACK_ROW_BOUND');
 signatures.push({table,count:rows.length,rowsSha256:sha(rows)});return rows;
}
function recordChain(rows,scope){
 let previous='',version=0;
 return rows.map(row=>{
  const record=JSON.parse(row.record),{digest,...body}=record;
  assert.equal(sha(body),digest);assert.equal(record.previous,previous);assert.equal(record.version,++version);assert.equal(row.version,record.version);if('id' in row)assert.equal(row.id,record.id);if('request' in row)assert.equal(row.request,record.id);
  for(const [key,value]of Object.entries(scope))assert.equal(record[key],value);
  previous=digest;return record;
 });
}
try{
 assert.notEqual(phase,'invalid');
 expected=JSON.parse(fs.readFileSync(control+'/expected-commerce.json','utf8'));
 snapshot=expected.snapshot;session=snapshot.session;
 assert.equal(expected.sessionId,session.sessionId);
 assert.match(expected.sessionId,/^[A-Za-z0-9_.:-]{1,100}$/);
 assert.equal(session.workspace,'ws_empire_1');
 assert.equal(session.twinWorkspace,'twin_'+sha({workspace:session.workspace,owner:session.owner,sessionId:session.sessionId}).slice(0,48));
 assert.ok(Number.isFinite(expected.minimumCreatedAt));
 stage='SQLITE_IDENTITY';
 db=new DatabaseSync(database,{readOnly:true,allowExtension:false});
 db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF;');
 assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
 assert.equal(db.prepare('PRAGMA application_id').get().application_id,1162038605);
 assert.equal(db.prepare('PRAGMA user_version').get().user_version,1);
 db.exec('BEGIN');
 stage='FROZEN_SESSION_STATE';
 assert.equal(snapshot.liveCommerce,'LOCKED');assert.equal(snapshot.birth,'NOT_BORN');assert.equal(snapshot.actualCashMovement,0);assert.equal(snapshot.next,null);
 assert.equal(session.status,'PAUSED');assert.equal(session.version,3);assert.equal(session.classification,'SIMULATED_OPERATIONS');assert.equal(session.externalEffects,0);
 stage='CANONICAL_SESSION_HISTORY';
 const sessionRows=read('work8_twin_events','SELECT version,request,record FROM work8_twin_events WHERE workspace=? AND session=? ORDER BY version',session.workspace,session.sessionId);
 const sessionHistory=recordChain(sessionRows,{workspace:session.workspace,owner:session.owner,sessionId:session.sessionId,twinWorkspace:session.twinWorkspace,classification:'SIMULATED_OPERATIONS',externalEffects:0});
 assert.deepEqual(sessionHistory.map(row=>row.action),['CREATE','RESUME','PAUSE']);assert.deepEqual(sessionHistory.at(-1),session);
 for(const row of sessionHistory)assert.equal(row.requestDigest,sha({p:{workspace:session.workspace,owner:session.owner},r:{id:row.id,sessionId:session.sessionId,expectedVersion:row.version-1,action:row.action}}));
 assert.ok(sessionHistory.every(row=>row.at>expected.minimumCreatedAt));
 stage='CANONICAL_AUTHORITY_REVOKED_HISTORY';
 const authorityRows=read('work8_twin_authority','SELECT version,request,record FROM work8_twin_authority WHERE workspace=? AND session=? ORDER BY version',session.workspace,session.sessionId);
 const authorityHistory=recordChain(authorityRows,{workspace:session.workspace,owner:session.owner,sessionId:session.sessionId,scope:'TWIN_SCHEDULER_ONLY'});
 assert.deepEqual(authorityHistory.map(row=>row.action),['GRANT','REVOKE']);assert.equal(authorityHistory[0].mode,'FIFTEEN_MINUTES');
 for(const row of authorityHistory)assert.equal(row.requestDigest,sha({p:{workspace:session.workspace,owner:session.owner},r:{action:row.action,id:row.id,sessionId:session.sessionId,expectedVersion:row.version-1,...(row.action==='GRANT'?{mode:row.mode}:{})}}));
 assert.equal(snapshot.authority.status,'REVOKED');assert.equal(snapshot.authority.scope,'TWIN_SCHEDULER_ONLY');assert.equal(snapshot.authority.externalEffects,0);assert.equal(snapshot.authority.version,2);assert.deepEqual(snapshot.authority.grant,authorityHistory.at(-1));
 assert.ok(authorityHistory.every(row=>row.at>expected.minimumCreatedAt));
 assert.equal(snapshot.records.length,2);assert.equal(snapshot.tasks.length,2);
 const missionIds=snapshot.records.map(row=>row.missionId).sort();
 assert.deepEqual(db.prepare('SELECT DISTINCT mission FROM commerce_runtime_receipts WHERE workspace=? ORDER BY mission').all(session.twinWorkspace).map(row=>row.mission),missionIds);
 stage='CANONICAL_TASK_PLAN_COMPLETION';
 const tasks=read('commerce_runtime_tasks','SELECT id,mission,version,record FROM commerce_runtime_tasks WHERE workspace=? ORDER BY id',session.twinWorkspace);
 assert.equal(tasks.length,2);
 for(const row of tasks){
  const task=JSON.parse(row.record),{steps,...visible}=task;
  assert.equal(task.id,row.id);assert.equal(task.mission,row.mission);assert.equal(task.workspace,session.twinWorkspace);assert.equal(task.owner,session.owner);assert.equal(task.status,'COMPLETE');assert.equal(task.fence,row.version);assert.equal(task.cursor,steps.length);assert.equal(task.paidInference,0);assert.ok(task.createdAt>expected.minimumCreatedAt);
  assert.deepEqual({...visible,stepCount:steps.length},snapshot.tasks.find(item=>item.id===row.id));
 }
 const missionEvidence=[],recoveryRecords=[],allOrderIds=new Set(),allEventIds=new Set();
 for(const projected of snapshot.records){
  stage='CANONICAL_MISSION_RECEIPT_CHAIN';
  const rows=read('commerce_runtime_receipts:'+projected.missionId,'SELECT version,id,record FROM commerce_runtime_receipts WHERE workspace=? AND mission=? ORDER BY version',session.twinWorkspace,projected.missionId);
  const history=recordChain(rows,{workspace:session.twinWorkspace,missionId:projected.missionId,classification:'SYNTHETIC',externalEffects:0});
  assert.equal(history.length,10);assert.ok(history.every(row=>Date.parse(row.at)>expected.minimumCreatedAt));
  assert.equal(new Set(history.map(row=>row.id)).size,history.length);assert.equal(new Set(history.map(row=>row.requestDigest)).size,history.length);
  const last=history.at(-1),state=last.state;
  const task=JSON.parse(tasks.find(row=>row.mission===projected.missionId).record);
  for(const [index,row]of history.entries()){
   assert.equal(row.id,sha({task:task.id,step:index}));assert.deepEqual(row.command,task.steps[index].command);assert.deepEqual(row.actor,task.steps[index].actor);
   assert.equal(row.requestDigest,sha({actor:row.actor,input:{id:row.id,missionId:row.missionId,expectedVersion:index,command:row.command}}));
  }
  assert.equal(projected.receiptDigest,last.digest);assert.equal(projected.version,last.version);assert.deepEqual(projected.orders,state.orders);
  assert.equal(projected.productId,state.candidate.productId);assert.equal(projected.variantId,state.candidate.offer.variantId);
  assert.equal(state.externalEffects,0);assert.equal(state.paidInference,0);
  const orders=Object.values(state.orders);assert.equal(orders.length,1);
  for(const [orderId,order]of Object.entries(state.orders)){assert.ok(!allOrderIds.has(orderId));allOrderIds.add(orderId);assert.equal(order.order.workspaceId,session.twinWorkspace);assert.equal(order.order.integrationMode,'SANDBOX');assert.equal(order.outcome,'DELIVERED');assert.ok(Date.parse(order.order.createdAt)>expected.minimumCreatedAt);}
  stage='CANONICAL_FINANCE_PLAN_BINDING';
  const plans=read('work8_sim_finance_plans:'+projected.missionId,'SELECT record,digest FROM work8_sim_finance_plans WHERE workspace=? AND mission=?',session.twinWorkspace,projected.missionId);assert.equal(plans.length,1);
  const plan=JSON.parse(plans[0].record);assert.equal(sha(plan),plans[0].digest);assert.equal(plan.workspace,session.twinWorkspace);assert.equal(plan.mission,projected.missionId);assert.equal(plan.sourceDigest,last.digest);assert.equal(plan.version,'SIM_FINANCE_V1');assert.ok(plan.createdAt>expected.minimumCreatedAt);assert.equal(plan.assumptions.actualCashMovement,0);
  stage='CANONICAL_COMMITTED_FINANCE_EVENTS';
  const eventRows=read('work8_sim_finance_events:'+projected.missionId,'SELECT sequence,record,digest FROM work8_sim_finance_events WHERE workspace=? AND mission=? ORDER BY sequence',session.twinWorkspace,projected.missionId);
  assert.ok(eventRows.length>0);assert.ok(eventRows.length<=plan.events.length);
  const events=eventRows.map((row,index)=>{const event=JSON.parse(row.record);assert.equal(row.sequence,index);assert.equal(sha(event),row.digest);assert.deepEqual(event,plan.events[index]);assert.equal(event.classification,'SIMULATION');assert.equal(event.sourceReceiptDigest,last.digest);assert.ok(state.orders[event.orderId]);assert.ok(Date.parse(event.at)>expected.minimumCreatedAt);assert.ok(!allEventIds.has(event.id));allEventIds.add(event.id);return event;});
  for(const event of events){
   const order=state.orders[event.orderId].order,quantity=order.items.reduce((n,item)=>n+item.quantity,0);
   assert.equal(event.currency,order.currency);assert.ok(Number.isSafeInteger(event.minor)&&event.minor>=0);
   const sourceAmounts={SALE:Math.round(state.candidate.economics.sellingPrice*quantity*100),COGS:order.items.reduce((n,item)=>n+Math.round(item.unitCost*item.quantity*100),0),FREIGHT:Math.round(state.candidate.offer.freight*quantity*100)};
   if(event.kind in sourceAmounts)assert.equal(event.minor,sourceAmounts[event.kind]);
  }
  assert.equal(projected.finance.classification,'SIMULATION_EXCLUDED_FROM_ACTUALS');assert.equal(projected.finance.actualCashMovement,0);assert.equal(projected.finance.planDigest,plans[0].digest);assert.equal(projected.finance.recordedEvents,events.length);assert.deepEqual(projected.finance.events,events);assert.equal(projected.finance.financial.eventDigest,sha(projected.finance.events));
  assert.equal(new Set(events.map(event=>event.id)).size,events.length);
  const presentedEvents=events.map(event=>({id:event.id,orderId:event.orderId,sourceReceiptDigest:event.sourceReceiptDigest,kind:event.kind,minor:event.minor,currency:event.currency,classification:event.classification,assumptionRef:event.assumptionRef,at:event.at}));
  recoveryRecords.push({missionId:projected.missionId,productId:state.candidate.productId,variantId:state.candidate.offer.variantId,receiptDigest:last.digest,version:last.version,classification:'SIMULATED_OPERATIONS',
   orders:Object.entries(state.orders).map(([orderId,wrapper])=>{const order=wrapper.order;return {orderId,status:order.status,fulfillmentStatus:order.fulfillmentStatus,integrationMode:order.integrationMode,outcome:wrapper.outcome,accepted:wrapper.accepted,shipped:wrapper.shipped,delivered:wrapper.delivered,currency:order.currency,createdAt:order.createdAt,updatedAt:order.updatedAt,items:order.items.map(item=>({itemId:item.itemId,supplierProductId:item.supplierProductId,supplierSku:item.supplierSku,quantity:item.quantity,unitCost:item.unitCost,currency:item.currency}))};}),
   history:history.map(row=>({id:row.id,missionId:row.missionId,version:row.version,at:row.at,commandType:row.command.type,previous:row.previous,digest:row.digest,requestDigest:row.requestDigest,classification:row.classification})),
   finance:{status:events.length===plan.events.length?'COMPLETE_SIMULATION':'INCOMPLETE_SIMULATION',recordedEvents:events.length,totalPlannedEvents:plan.events.length,sourceReceiptDigest:plan.sourceDigest,planDigest:plans[0].digest,eventDigest:sha(presentedEvents),events:presentedEvents,classification:'SIMULATION_EXCLUDED_FROM_ACTUALS',actualCashMovement:0}});
  missionEvidence.push({missionId:projected.missionId,receiptCount:history.length,lastReceiptDigest:last.digest,orderCount:orders.length,ordersSha256:sha(state.orders),planDigest:plans[0].digest,recordedFinancialEvents:events.length,eventDigest:sha(events),fullFinancialSettlementClaimed:false});
 }
 stage='CANONICAL_LABELLED_ADMISSION';
 const admissions=read('work8_twin_admissions','SELECT id,record FROM work8_twin_admissions WHERE workspace=? AND session=? ORDER BY id',session.workspace,session.sessionId);assert.equal(admissions.length,1);
 const admission=JSON.parse(admissions[0].record);assert.equal(admission.classification,'LABELLED_TEST_FIXTURES_NOT_GENUINE_PRODUCTS');assert.equal(admission.externalEffects,0);assert.equal(admission.paidInference,0);assert.equal(admission.count,2);assert.equal(admission.sessionId,session.sessionId);
 assert.equal(admission.owner,session.owner);assert.equal(admission.tasks.length,2);
 for(const admitted of admission.tasks){const task=JSON.parse(tasks.find(row=>row.id===admitted.taskId).record);assert.equal(admitted.missionId,task.mission);assert.equal(admitted.planDigest,sha(task.steps));const record=snapshot.records.find(row=>row.missionId===task.mission);assert.equal(admitted.productId,record.productId);assert.equal(admitted.sku,record.sku);}
 stage='CANONICAL_OBSERVATIONS_AND_SCHEDULER';
 const observations=read('work8_twin_observations','SELECT id,record FROM work8_twin_observations WHERE workspace=? AND session=? ORDER BY id',session.workspace,session.sessionId);
 for(const row of observations){const observation=JSON.parse(row.record);assert.equal(observation.classification,'SIMULATED_OPERATIONS');assert.equal(observation.externalEffects,0);}
 // The two tasks and finance admissions are the actual native fixture plans, not
 // disconnected rows. Read each extra canonical table, including idempotency and
 // scheduler state, for whole-session equality after the authority is revoked.
 for(const table of ['work8_sim_finance_admission','work8_sim_finance_cursor']){
  const rows=read(table,'SELECT * FROM '+table+' WHERE workspace IN (?, ?, ?) ORDER BY rowid',session.twinWorkspace,'admit:'+session.twinWorkspace,'probe:'+session.twinWorkspace);
  assert.ok(rows.every(row=>typeof row.workspace==='string'));
 }
 read('work8_twin_scheduler','SELECT * FROM work8_twin_scheduler ORDER BY id');
 db.exec('ROLLBACK');
 const canonical={sessionId:session.sessionId,sessionDigest:session.digest,sessionStatus:'PAUSED',authorityDigest:authorityHistory.at(-1).digest,authorityStatus:'REVOKED',authorityScope:'TWIN_SCHEDULER_ONLY',signatures,missionEvidence};
 const recovery={schema:'WORK8_RECOVERY_COMMERCE_V1',classification:'HISTORICAL_SIMULATED_OPERATIONS',session:{sessionId:session.sessionId,version:session.version,status:session.status,digest:session.digest,twinWorkspace:session.twinWorkspace},authority:{status:'REVOKED',version:authorityHistory.at(-1).version,digest:authorityHistory.at(-1).digest,grantsAuthority:false},records:recoveryRecords,coverage:'COMPLETE_SELECTED_SESSION_WITHIN_BOUNDS',readOnly:true,actualCashMovement:0,externalEffects:0,paidInference:0,liveCommerce:'LOCKED',birth:'NOT_BORN'};
 stage='CROSS_PHASE_CANONICAL_EQUALITY';
 if(phase==='normal')fs.writeFileSync(control+'/expected-recovery-commerce.json',JSON.stringify(recovery)+'\n');
 else {assert.deepEqual(canonical,JSON.parse(fs.readFileSync(evidence+'/normal-commerce-independent-readback.json','utf8')).canonical);assert.deepEqual(recovery,JSON.parse(fs.readFileSync(control+'/expected-recovery-commerce.json','utf8')));}
 receipt.canonical=canonical;receipt.canonicalSha256=sha(canonical);receipt.status='PASS_INDEPENDENT_PROCESS_COMMERCE_READBACK_ONLY';receipt.authorityRestored=false;receipt.liveCommerce='LOCKED';receipt.actualCashMovement=0;
 receipt.recoveryProjectionSha256=sha(recovery);receipt.noDuplicateReplay=true;receipt.populatedHistoryPreserved=true;
 receipt.sanitizedHistoricalSimulation=recovery;
}catch(error){receipt.safeFailure={stage,code:error?.code==='ERR_ASSERTION'?'CANONICAL_READBACK_ASSERTION_FAILED':error?.code==='ERR_SQLITE_ERROR'?'CANONICAL_SQLITE_READ_FAILED':'CANONICAL_READBACK_FAILED',name:error?.name==='AssertionError'?'AssertionError':'READBACK_ERROR',sourceFrames:(String(error?.stack??'').match(/offline-commerce-readback\.mjs:\d+:\d+/g)??[]).slice(0,8),valuesWithheld:true};process.exitCode=1;}
finally{db?.close();fs.writeFileSync(evidence+'/'+phase+'-commerce-independent-readback.json',JSON.stringify(receipt,null,2)+'\n');}
