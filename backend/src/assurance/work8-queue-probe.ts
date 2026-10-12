import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {digest} from '../intelligence/model.js';

/** Independent read-only backlog/misfire detector; it never resubmits a job.
 * Queued backlog uses four 30-second cycles; missed scheduled admission uses one. Neither is a provider completion SLA. */
export function readWork8QueueProbe(root:string,workspace:string,now=Date.now()){
 const base={id:'work8_read_queue_progress',capability:'work8_read_queue_progress',classification:'work8_read_queue_progress',severity:'HIGH',runbookId:null};
 const thresholdMs=120000,scheduleThresholdMs=30000;
 try{
  if(!/^[A-Za-z0-9_.:-]{1,160}$/.test(workspace)||!Number.isSafeInteger(now))throw Error('QUEUE_SCOPE');
  const file=path.join(root,'commissioning','intelligence.sqlite');
  if(fs.realpathSync(file)!==file||!fs.lstatSync(file).isFile())throw Error('QUEUE_PATH');
  const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:1000});
  try{
   db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
   const jobs=db.prepare("SELECT id,status,created,lease_until FROM jobs WHERE workspace=? AND status IN ('QUEUED','RUNNING') ORDER BY id LIMIT 21").all(workspace);
   const sizes=db.prepare('SELECT length(CAST(body AS BLOB)) bytes FROM schedules WHERE workspace=? LIMIT 33').all(workspace);
   if(jobs.length>20||sizes.length>32||sizes.reduce((n,r)=>n+Number(r.bytes),0)>65536)throw Error('QUEUE_SOURCE_BOUND');
   const schedules=db.prepare('SELECT id,next_at,body FROM schedules WHERE workspace=? ORDER BY id LIMIT 33').all(workspace).map(r=>{
    const body=JSON.parse(String(r.body));
    if(body.id!==r.id||typeof body.enabled!=='boolean'||!Number.isSafeInteger(r.next_at))throw Error('QUEUE_SOURCE_INTEGRITY');
    const admission=body.lastAdmission,missed=body.missedSlot;
    const hasAdmission=Object.hasOwn(body,'lastAdmission'),hasMissed=Object.hasOwn(body,'missedSlot');
    const record=(value:unknown):value is Record<string,any>=>value!==null&&typeof value==='object'&&!Array.isArray(value);
    // Legacy schedules have neither field. Present-but-falsy or inconsistent
    // metadata is corruption, never a reason to erase the missed-slot signal.
    if(hasAdmission&&(!record(admission)||!Number.isSafeInteger(admission.dueAt)||!Number.isSafeInteger(admission.admittedAt)||admission.admittedAt<admission.dueAt||admission.admittedAt>now))throw Error('QUEUE_SOURCE_INTEGRITY');
    if(hasMissed&&(!record(missed)||!hasAdmission||missed.dueAt!==admission.dueAt||missed.admittedAt!==admission.admittedAt))throw Error('QUEUE_SOURCE_INTEGRITY');
    if(hasAdmission&&hasMissed!==(admission.admittedAt-admission.dueAt>=scheduleThresholdMs))throw Error('QUEUE_SOURCE_INTEGRITY');
    return {id:String(r.id),enabled:body.enabled,nextAt:Number(r.next_at),missedSlot:missed??null};
   });
   if(jobs.some(j=>!Number.isSafeInteger(j.created)||Number(j.created)>now||!Number.isSafeInteger(j.lease_until)))throw Error('QUEUE_SOURCE_INTEGRITY');
   const queued=jobs.filter(j=>j.status==='QUEUED');
   const expired=jobs.filter(j=>j.status==='RUNNING'&&Number(j.lease_until)<=now);
   const old=queued.filter(j=>now-Number(j.created)>=thresholdMs);
   const overdue=schedules.filter(s=>s.enabled&&(now-s.nextAt>=scheduleThresholdMs||s.missedSlot!==null));
   const status=expired.length?'FAILED':old.length||overdue.length?'DEGRADED':'HEALTHY';
   return {...base,status,summary:status==='HEALTHY'?'No overdue queued read or scheduled admission in this bounded snapshot.':'Queued reads or scheduled admissions exceeded their progress bound; preserve unknown outcomes and escalate without resubmission.',evidence:{observedAt:now,thresholdMs,scheduleThresholdMs,missedSlots:overdue.filter(s=>s.missedSlot).map(s=>({id:s.id,...s.missedSlot})),queued:queued.length,running:jobs.length-queued.length,oldQueuedIds:old.map(j=>String(j.id)),expiredLeaseIds:expired.map(j=>String(j.id)),overdueScheduleIds:overdue.map(s=>s.id),oldestQueuedAgeMs:queued.length?Math.max(...queued.map(j=>now-Number(j.created))):null,sourceDigest:digest({jobs,schedules}),externalEffects:0,inferenceCalls:0,coverage:'ALL_ACTIVE_READ_JOBS_MAX_20_AND_SCHEDULES_MAX_32; HISTORICAL_FAILURES_RETAINED_ELSEWHERE'}};
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
 }catch(error){return {...base,status:'UNAVAILABLE',summary:'Read-queue source integrity or bounded coverage is unavailable; no healthy progress inferred.',evidence:{observedAt:now,reason:error instanceof Error&&error.message==='QUEUE_SOURCE_BOUND'?'QUEUE_SOURCE_BOUND':'QUEUE_SOURCE_UNVERIFIED',externalEffects:0,inferenceCalls:0}};}
}
