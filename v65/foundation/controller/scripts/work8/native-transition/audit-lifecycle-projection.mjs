// Source-bound, read-only classification of the exact examination's Brain audit
// delta. This never grants authority or edits the database. Unknown additions
// fail closed. Only the final orderly stopPillow event is currently justified.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

export const backendSource='6c1e63ba20619ee480742fd87dc810ca93152e22';
export const sourcePins=Object.freeze({
 'backend/dist/brain/database.js':'9c6c9362e83f1ee6119d29855918d441e7016ae447a0e40664594bd54a2e4311',
 'backend/dist/brain/audit/audit-logger.js':'dda9a59b0eec6cb53ad410f3ebb305abd0dc5f49aca1b3b324ae48e231c93dcf',
 'backend/dist/orchestration/pillow-host/pillow-host.js':'67eaa87b8826f0bfdbec628b9e6c472cc4efea4425fcc5343a735e6e533de6bd',
 'backend/dist/app.js':'3e0982e5dd74353e1ca12848244d44a8253b7b1eb95f7f33f13017180f2203d0',
});
const columns=['id','action','actor','workspace_id','company_id','agent_id','correlation_id','metadata','created_at'];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hash=/^[0-9a-f]{64}$/;
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
const sha=value=>createHash('sha256').update(value).digest('hex');
function need(ok,code){if(!ok){const error=new Error(code);error.code=code;throw error;}}
function iso(value){
 need(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value),'AUDIT_TIME_FORMAT_REFUSED');
 const ms=Date.parse(value);need(Number.isSafeInteger(ms)&&new Date(ms).toISOString()===value,'AUDIT_TIME_INVALID');return ms;
}
export function verifyAuditProjectionSources(appRoot='/app'){
 need(path.isAbsolute(appRoot)&&fs.realpathSync(appRoot)===appRoot,'AUDIT_SOURCE_ROOT_REFUSED');
 for(const [relative,expected] of Object.entries(sourcePins)){
  const filename=path.join(appRoot,relative),s=fs.lstatSync(filename);
  need(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&fs.realpathSync(filename)===filename,'AUDIT_SOURCE_FILE_REFUSED');
  need(sha(fs.readFileSync(filename))===expected,'AUDIT_SOURCE_DIGEST_MISMATCH');
 }
 return {source:backendSource,files:sourcePins};
}

export function projectAddedAuditRows(rows,{baselineHashes,phase,baselineObservedAt,readbackAtMs,generation,drain=null}){
 need(Array.isArray(rows)&&rows.length<=50000&&Array.isArray(baselineHashes)&&baselineHashes.length<=50000,'AUDIT_ROW_BOUND');
 need(['normal','recovery','returned','replayed','final'].includes(phase),'AUDIT_PHASE_REFUSED');
 const baselineAt=iso(baselineObservedAt);
 need(Number.isSafeInteger(readbackAtMs)&&readbackAtMs>=baselineAt,'AUDIT_READBACK_TIME_REFUSED');
 need(typeof generation==='string'&&uuid.test(generation),'AUDIT_GENERATION_REFUSED');
 const remaining=new Map();
 for(const h of baselineHashes){need(typeof h==='string'&&hash.test(h),'AUDIT_BASELINE_HASH_REFUSED');remaining.set(h,(remaining.get(h)||0)+1);}
 const added=[],ids=new Set();
 for(const row of rows){
  need(row&&typeof row==='object'&&json(Object.keys(row))===json(columns),'AUDIT_ROW_SCHEMA_REFUSED');
  need(typeof row.id==='string'&&uuid.test(row.id)&&!ids.has(row.id),'AUDIT_ROW_IDENTITY_REFUSED');ids.add(row.id);
  const rowHash=sha(json(row)),count=remaining.get(rowHash)||0;
  if(count){remaining.set(rowHash,count-1);continue;}
  added.push({row,rowHash});
 }
 need([...remaining.values()].every(n=>n===0),'AUDIT_BASELINE_ROW_NOT_PRESERVED');
 need(added.length<=1,'AUDIT_UNEXPLAINED_ADDITION_COUNT');
 if(phase==='final'){
  need(drain&&drain.schema==='work8-v62-native-drain-observation-v1'&&drain.actualNativeWritersDrained===true&&drain.source===backendSource&&drain.generation===generation,'AUDIT_ORDERLY_DRAIN_PROOF_REQUIRED');
  need(Number.isSafeInteger(drain.startedAtMs)&&Number.isSafeInteger(drain.completedAtMs)&&drain.startedAtMs>=baselineAt&&drain.completedAtMs>=drain.startedAtMs&&drain.completedAtMs<=readbackAtMs,'AUDIT_DRAIN_TIME_REFUSED');
 }
 const events=[];
 if(added.length){
  need(phase==='final','AUDIT_ADDITION_BEFORE_ORDERLY_DRAIN');
  const {row,rowHash}=added[0];
  need(row.action==='pillow.shutdown'&&row.actor==='pillow-host'&&row.workspace_id==='system'&&row.company_id===null&&row.agent_id===null,'AUDIT_EVENT_SOURCE_CONTRACT_REFUSED');
  need(typeof row.correlation_id==='string'&&uuid.test(row.correlation_id),'AUDIT_CORRELATION_REFUSED');
  need(typeof row.metadata==='string'&&Buffer.byteLength(row.metadata)<=128,'AUDIT_METADATA_REFUSED');
  let metadata;try{metadata=JSON.parse(row.metadata);}catch{need(false,'AUDIT_METADATA_REFUSED');}
  need(metadata&&typeof metadata==='object'&&!Array.isArray(metadata)&&json(Object.keys(metadata))===json(['stoppedAt']),'AUDIT_METADATA_SCHEMA_REFUSED');
  need(row.metadata===JSON.stringify(metadata),'AUDIT_METADATA_SERIALIZATION_REFUSED');
  const stoppedAt=iso(metadata.stoppedAt),createdAt=iso(row.created_at);
  need(stoppedAt>=drain.startedAtMs&&createdAt>=stoppedAt&&createdAt<=drain.completedAtMs,'AUDIT_EVENT_OUTSIDE_DRAIN');
  events.push({rowSha256:rowHash,idSha256:sha(row.id),correlationIdSha256:sha(row.correlation_id),metadataSha256:sha(row.metadata),action:'pillow.shutdown',actor:'pillow-host',workspace:'system',company:null,agent:null,stoppedAt:metadata.stoppedAt,createdAt:row.created_at,sourceCallsite:'backend/dist/orchestration/pillow-host/pillow-host.js:stopPillow',classification:'EXACT_SOURCE_ORDERLY_SHUTDOWN_AUDIT'});
 }
 return {schema:'work8-v62-brain-audit-lifecycle-projection-v1',status:'PASS_SOURCE_ATTRIBUTED_AUDIT_DELTA',phase,source:backendSource,generationSha256:sha(generation),baselineRows:baselineHashes.length,currentRows:rows.length,addedRows:events.length,originalRowsPreserved:true,events,rawRowsRetained:false,rawMetadataRetained:false,wholeRowsAccepted:[]};
}
