import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fields=['missionId','dispatchId','workerId','action','scope','buildSha','inputHash'];
const request=j=>Object.fromEntries(fields.map(k=>[k,j[k]]));
const scope={workspaceId:'ws_empire_1',ownerEmail:'hh4-owner@example.test'};
export function readPendingState(primary){
 const read=(file,fn)=>{const s=fs.lstatSync(file);assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.size<=67108864);const db=new DatabaseSync(file,{readOnly:true,allowExtension:false});try{return fn(db);}finally{db.close();}};
 const execution=read(primary+'.mission-execution.sqlite',db=>({meta:db.prepare('SELECT * FROM execution_meta ORDER BY id').all().map(x=>({...x})),jobs:db.prepare('SELECT * FROM execution_jobs ORDER BY job_id').all().map(x=>({...x})),events:db.prepare('SELECT * FROM execution_events ORDER BY seq').all().map(x=>({...x}))}));
 const rows=read(primary+'.missions.sqlite',db=>db.prepare('SELECT * FROM mission_snapshot ORDER BY id').all().map(x=>({...x})));
 assert.equal(rows.length,1);assert.equal(rows[0].id,1);assert.ok(Buffer.byteLength(JSON.stringify({execution,rows}))<=1048576,'PENDING_EVIDENCE_BOUND');
 const envelope=JSON.parse(rows[0].envelope);assert.equal(envelope.version,3);assert.deepEqual(envelope.scope,{ownerEmail:scope.ownerEmail,workspaceId:scope.workspaceId});
 return {execution,missionRows:rows,history:envelope.state};
}
export function validatePendingState(state,{source,oracle,completed}){
 assert.match(source,/^[a-f0-9]{40}$/);const e=state.execution;
 assert.equal(e.meta.length,1);assert.equal(e.meta[0].id,1);assert.deepEqual(JSON.parse(e.meta[0].scope),scope);
 assert.equal(e.jobs.length,1,'EXACT_SINGLE_PENDING_JOB_REQUIRED');const j=JSON.parse(e.jobs[0].document);
 assert.deepEqual(Object.keys(j).sort(),[...fields,'jobId','status','attempts','createdAt','leaseToken','leaseUntil','receipt','reconciled','lastError'].sort());assert.ok(Number.isFinite(Date.parse(j.createdAt)));
 assert.equal(e.jobs[0].job_id,j.jobId);assert.equal(j.buildSha,source);assert.deepEqual(j.scope,scope);
 assert.equal(j.action,'authority.snapshot.v1');assert.equal(j.workerId,'pillow-authority-reader-v1');assert.equal(j.inputHash,digest({}));
 assert.match(j.missionId,/^[a-zA-Z0-9._-]{1,160}$/);assert.match(j.dispatchId,/^[a-zA-Z0-9._-]{1,240}$/);
 assert.equal(j.jobId,'mae_'+digest([scope.workspaceId,scope.ownerEmail,j.missionId,j.workerId]));
 const h=state.history,intents=h.checkpoints.filter(x=>String(x.label).includes('dispatch-intent'));
 assert.equal(intents.length,1,'NO_OTHER_EXECUTABLE_INTENTS');assert.equal(intents[0].label,'authority.snapshot.v1:dispatch-intent');assert.equal(intents[0].missionId,j.missionId);assert.equal(intents[0].state,'Running');assert.deepEqual(intents[0].payload.binding,request(j));
 const m=h.missions.find(x=>x.missionId===j.missionId);assert.ok(m);assert.equal(m.highRisk,false);assert.deepEqual(m.workers,[j.workerId]);
 assert.ok(h.missions.filter(x=>x.missionId!==j.missionId).every(x=>x.workers.length===0&&!x.grandKingApproved),'UNEXPECTED_MISSION_AUTHORITY');
 assert.ok(h.timeline.some(x=>x.entryId===j.dispatchId&&x.label==='dispatch:'+j.missionId&&x.state==='Running'));
 assert.equal(j.leaseToken,null);assert.equal(j.leaseUntil,null);assert.equal(j.lastError,null);
 assert.ok(e.events.every(x=>x.job_id===j.jobId));
 if(!completed){
  assert.equal(j.status,'queued');assert.equal(j.attempts,0);assert.equal(j.receipt,null);assert.equal(j.reconciled,false);assert.ok(['Running','Waiting'].includes(m.currentStatus));
  assert.deepEqual(e.events.map(x=>x.event),['durably_admitted']);
  if(oracle)assert.deepEqual(state,oracle,'EXACT_SOURCE_PENDING_STATE_CHANGED');
 }else{
  assert.ok(oracle,'SOURCE_ORACLE_REQUIRED');assert.deepEqual(request(j),request(JSON.parse(oracle.execution.jobs[0].document)));assert.equal(j.createdAt,JSON.parse(oracle.execution.jobs[0].document).createdAt);
  assert.equal(j.status,'completed');assert.equal(j.attempts,1);assert.equal(j.reconciled,true);assert.equal(m.currentStatus,'Completed');
  const r=j.receipt;assert.deepEqual(request(r),request(j));assert.equal(r.jobId,j.jobId);assert.equal(r.status,'completed');assert.equal(r.certificationCredit,false);
  assert.equal(r.output.kind,'actual_readonly_authority_inspection');assert.ok(Number.isFinite(Date.parse(r.output.observedAt)));assert.ok(Number.isFinite(Date.parse(r.completedAt)));
  assert.deepEqual(Object.keys(r.output).sort(),['authority','kind','observedAt']);const a=r.output.authority;assert.deepEqual(Object.keys(a).sort(),['birthStatus','certificationReceiptIngestion','commerceStatus','independentCertification','realCommerceAuthorized','reason','technicallyReady','waveCredit']);assert.ok(['NOT_IMPLEMENTED','IMPLEMENTED_UNVERIFIED_ONLY'].includes(a.certificationReceiptIngestion));assert.ok(typeof a.reason==='string'&&a.reason.length<=4096);assert.equal(a.birthStatus,'NOT_BORN');assert.equal(a.commerceStatus,'LOCKED');assert.equal(a.technicallyReady,false);assert.equal(a.realCommerceAuthorized,false);assert.equal(a.waveCredit,0);assert.equal(a.independentCertification,'UNVERIFIED');
  assert.equal(r.outputHash,digest(r.output));assert.equal(r.receiptId,'maer_'+createHash('sha256').update(j.jobId+':'+r.outputHash).digest('hex'));
  assert.deepEqual(e.events.map(x=>x.event),['durably_admitted','readonly_claimed','readonly_output_and_receipt_committed','mission_receipt_reconciled']);assert.deepEqual(e.events[0],oracle.execution.events[0]);
  assert.deepEqual(h.missions.map(x=>x.missionId).sort(),oracle.history.missions.map(x=>x.missionId).sort(),'MISSION_SET_CHANGED');
  for(const old of oracle.history.missions.filter(x=>x.missionId!==j.missionId))assert.deepEqual(h.missions.find(x=>x.missionId===old.missionId),old);
  const original=oracle.history.missions.find(x=>x.missionId===j.missionId);
  const immutable=x=>Object.fromEntries(Object.entries(x).filter(([key])=>!['currentStatus','updatedAt','progress'].includes(key)));
  assert.deepEqual(immutable(m),immutable(original));assert.equal(m.progress,100);assert.ok(Number.isFinite(Date.parse(m.updatedAt)));
  const additions={};for(const key of ['transitions','checkpoints','retries','recoveries','timeline','reports','auditTrail']){assert.deepEqual(h[key].slice(0,oracle.history[key].length),oracle.history[key],'CAPTURED_HISTORY_CHANGED:'+key);additions[key]=h[key].slice(oracle.history[key].length);}
  for(const key of ['retries','recoveries','reports'])assert.deepEqual(additions[key],[]);
  const expectedTransitions=original.currentStatus==='Waiting'?[['Waiting','Running','Stored readonly output ready for reconciliation'],['Running','Completed','Actual readonly authority inspection receipt reconciled; no Birth or commerce credit']]:[['Running','Completed','Actual readonly authority inspection receipt reconciled; no Birth or commerce credit']];
  assert.equal(additions.transitions.length,expectedTransitions.length);assert.equal(additions.timeline.length,expectedTransitions.length);
  const expectedAudit=[];
  additions.transitions.forEach((t,i)=>{const [from,to,reason]=expectedTransitions[i];assert.equal(t.missionId,j.missionId);assert.equal(t.fromState,from);assert.equal(t.toState,to);assert.equal(t.reason,reason);assert.equal(t.fabricated,false);assert.ok(Number.isFinite(Date.parse(t.timestamp)));
   assert.deepEqual(additions.timeline[i],{entryId:t.transitionId,timestamp:t.timestamp,label:from+'→'+to,state:to,notes:[reason]});
   expectedAudit.push('transition:'+t.transitionId+'@'+t.timestamp,'mission_saved:'+j.missionId+'@'+t.timestamp,'timeline:'+t.transitionId+'@'+t.timestamp);
  });
  assert.equal(additions.checkpoints.length,1);const c=additions.checkpoints[0];assert.equal(c.label,'authority.snapshot.v1:reconciled');assert.equal(c.missionId,j.missionId);assert.equal(c.state,'Completed');
  assert.deepEqual(c.payload,{jobId:j.jobId,receiptId:r.receiptId,outputHash:r.outputHash,executionBuildSha:source,operation:j.action,certificationCredit:false});
  expectedAudit.push('mission_saved:'+j.missionId+'@'+m.updatedAt,'checkpoint:'+c.checkpointId+'@'+c.timestamp);assert.deepEqual(additions.auditTrail,expectedAudit);

 }
 return j;
}

export function validatePendingPlan(plan,{capability,source,state,expectedDigest}){
 assert.ok(['queued','completed'].includes(plan.stage));
 assert.deepEqual(Object.keys(plan).sort(),['oracle','stage','digest','source','capability','authorization',...(plan.stage==='completed'?['completedState']:[])].sort());
 assert.match(capability,/^[a-f0-9-]{36}$/);assert.equal(plan.capability,capability);assert.equal(plan.source,source);assert.match(plan.digest,/^[a-f0-9]{64}$/);assert.equal(plan.digest,expectedDigest,'PARENT_CAPTURE_DIGEST_MISMATCH');
 assert.equal(plan.authorization,'FRESH_GENERATED_SINGLE_READONLY_EXAMINATION');
 validatePendingState(state,{source,oracle:plan.oracle,completed:plan.stage==='completed'});
 if(plan.stage==='completed')assert.deepEqual(state,plan.completedState,'RESTART_RECEIPT_OR_HISTORY_CHANGED');
}
