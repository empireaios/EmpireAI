import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';import {digest} from '../intelligence/model.js';
/** Passive queue metadata only. Existing admission cap20 and worker lease300s remain unchanged. */
export function readWork8QueueProbe(root:string,workspace:string,now=Date.now()){
 const base={id:'intelligence_queue_pressure',capability:'intelligence_queue_pressure',classification:'intelligence_queue_pressure',severity:'HIGH',runbookId:null};
 try{
  if(!/^[A-Za-z0-9_.:-]{1,160}$/.test(workspace)||!Number.isSafeInteger(now))throw Error('QUEUE_SCOPE');
  const file=path.join(root,'commissioning','intelligence.sqlite');if(fs.realpathSync(file)!==file||!fs.lstatSync(file).isFile())throw Error('QUEUE_PATH');
  const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:1000});
  try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
   const unknown=db.prepare("SELECT 1 present FROM jobs WHERE workspace=? AND status NOT IN ('QUEUED','RUNNING','COMPLETED','PARTIAL','FAILED','INTERRUPTED') LIMIT 1").get(workspace);if(unknown)throw Error('QUEUE_UNKNOWN_STATUS');
   const metadata=db.prepare("SELECT length(CAST(id AS BLOB)) bytes,status,created,lease_until FROM jobs WHERE workspace=? AND status IN ('QUEUED','RUNNING') ORDER BY created,id LIMIT 21").all(workspace);
   if(metadata.length>20||metadata.some(r=>Number(r.bytes)>256||!Number.isSafeInteger(r.created)||Number(r.created)>now||(r.status==='RUNNING'&&!Number.isSafeInteger(r.lease_until))))throw Error('QUEUE_METADATA_BOUND');
   const rows=db.prepare("SELECT substr(id,1,161) id,status,created,lease_until FROM jobs WHERE workspace=? AND status IN ('QUEUED','RUNNING') ORDER BY created,id LIMIT 21").all(workspace);
   if(rows.length>20)throw Error('QUEUE_ACTIVE_BOUND');
   if(rows.some(r=>typeof r.id!=='string'||r.id.length>160||!Number.isSafeInteger(r.created)||Number(r.created)>now||(r.status==='RUNNING'&&!Number.isSafeInteger(r.lease_until))))throw Error('QUEUE_METADATA_UNVERIFIED');
   const queued=rows.filter(r=>r.status==='QUEUED'),running=rows.filter(r=>r.status==='RUNNING'),expired=running.filter(r=>Number(r.lease_until)<now),oldestQueuedAgeMs=queued.length?now-Number(queued[0]!.created):0;
   const status=expired.length?'BLOCKED':rows.length===20||oldestQueuedAgeMs>300000?'DEGRADED':'HEALTHY';
   return {...base,status,summary:status==='HEALTHY'?'Fresh active queue metadata is below pressure bounds; completed job outcomes are separate.':expired.length?'Active worker lease expired; preserve uncertainty and escalate without replay.':'Active queue is full or queued work exceeds five minutes; bounded drain required.',evidence:{observedAt:now,active:rows.length,queued:queued.length,running:running.length,expiredLeases:expired.length,oldestQueuedAgeMs,capacity:20,queuedAgeThresholdMs:300000,metadataDigest:digest(rows),externalEffects:0}};
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
 }catch{return {...base,status:'UNAVAILABLE',summary:'Queue metadata unavailable or outside bounded integrity checks; no healthy backlog state inferred.',evidence:{observedAt:now,reason:'QUEUE_SOURCE_UNVERIFIED',externalEffects:0}};}
}
