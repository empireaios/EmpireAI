// Read-only Assurance preservation: valid historical counters are immutable; new recovery activity is refused.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const sha=x=>createHash('sha256').update(x).digest('hex');
const validTime=n=>Number.isSafeInteger(n)&&n>=0;

export function cpRecord(row){
 const body=JSON.parse(row.body),copy=structuredClone(body),base={kind:row.kind,bodySha256:sha(row.body)};
 if(row.kind==='heartbeat'){delete copy.at;return {...base,identitySha256:sha(json(copy)),at:body.at};}
 if(row.kind==='probe'){for(const key of ['status','summary','evidence','observedAt','sourceObservedAt','scopeContext'])delete copy[key];return {...base,identitySha256:sha(json(copy)),at:body.observedAt,status:body.status};}
 if(row.kind==='incident'){for(const key of ['lastAt','recurrence','status','limitation'])delete copy[key];return {...base,identitySha256:sha(json(copy)),at:body.lastAt,firstAt:body.firstAt,recurrence:body.recurrence,status:body.status,attempts:body.attempts,limitation:body.limitation??null};}
 return base;
}

export function classifyAttempts(value){
 if(value===undefined)return {type:'MISSING',classification:'MISSING'};
 if(value===null)return {type:'NULL',classification:'NULL'};
 if(Array.isArray(value))return {type:'ARRAY',classification:value.length===0?'EMPTY_COLLECTION':'NONEMPTY_COLLECTION'};
 if(typeof value==='number')return {type:'NUMBER',classification:!Number.isFinite(value)?'NONFINITE_NUMBER':Object.is(value,-0)?'NEGATIVE_ZERO':value===0?'NUMERIC_ZERO':value<0?'NEGATIVE_NUMBER':Number.isSafeInteger(value)?'POSITIVE_INTEGER':Number.isInteger(value)?'OUT_OF_SAFE_RANGE':'NONINTEGER_NUMBER'};
 return {type:({string:'STRING',boolean:'BOOLEAN',object:'OBJECT'})[typeof value]??'OTHER',classification:'WRONG_TYPE'};
}

function withContext(prior,current,context,check){
 try{return check();}catch(error){
  if(prior?.kind==='incident'||current?.kind==='incident'){
   const before=classifyAttempts(prior?.attempts),after=classifyAttempts(current?.attempts);
   const same=prior&&current?prior.identitySha256===current.identitySha256:null;
   error.assuranceContext={schema:'work8-v110-assurance-invariant-context-v1',domain:'assurance',store:'cp_records',
    invariant:String(error.message??'').split('\n')[0],incidentKeySha256:context.incidentKeySha256,
    expectedType:'NUMBER',expectedClass:prior?'UNCHANGED_BASELINE':'NUMERIC_ZERO',priorType:before.type,observedType:after.type,
    priorClass:before.classification,observedClass:after.classification,
    priorBodySha256:prior?.bodySha256??null,observedBodySha256:current?.bodySha256??null,
    priorIdentitySha256:prior?.identitySha256??null,observedIdentitySha256:current?.identitySha256??null,
    identityEqual:same,changeAttribution:!prior?'NEW_INCIDENT':same?'EXISTING_INCIDENT_DIAGNOSTIC_FIELDS_ONLY':same===false?'EXISTING_IDENTITY_CHANGED':'UNESTABLISHED',
    readbackPhase:context.readbackPhase,checkerSha256:context.checkerSha256,rawIncidentRetained:false,applicationAcceptance:false};
  }
  throw error;
 }
}

export function checkCp(prior,current,context={}){
 return withContext(prior,current,context,()=>{
  assert.ok(current,'CONTROL_PLANE_RECORD_DELETED');assert.equal(current.kind,prior.kind);
  if(prior.kind==='incident'){
   assertValidAttempts(prior.attempts);assertValidAttempts(current.attempts);
   assert.equal(current.attempts,prior.attempts,'NEW_RECOVERY_ATTEMPT');
  }
  if(prior.bodySha256===current.bodySha256)return;
  assert.ok(['heartbeat','probe','incident'].includes(prior.kind),'CONTROL_PLANE_AUTHORITY_OR_HISTORY_CHANGED');
  assert.equal(current.identitySha256,prior.identitySha256,'CONTROL_PLANE_IDENTITY_CHANGED');assert.ok(validTime(current.at)&&current.at>=prior.at,'CONTROL_PLANE_TIME_REGRESSED');
  if(prior.kind==='probe')assert.ok(['HEALTHY','DEGRADED','FAILED','NOT_APPLICABLE','EXTERNALLY_BLOCKED','UNAVAILABLE','STALE','NOT_CHECKED','UNVERIFIED','BLOCKED','NOT_INSTALLED'].includes(current.status));
  if(prior.kind==='incident'){assert.ok(current.recurrence>=prior.recurrence&&Number.isSafeInteger(current.recurrence));assert.ok(['DETECTED','UNRESOLVED'].includes(prior.status)&&['DETECTED','UNRESOLVED'].includes(current.status),'UNEXAMINED_INCIDENT_LIFECYCLE');if(prior.status==='UNRESOLVED')assert.equal(current.status,'UNRESOLVED');assert.ok(current.limitation===null||current.limitation==='No permitted recovery runbook');}
 });
}

export function checkNewCp(current,context={}){
 return withContext(null,current,context,()=>{
  assert.ok(['heartbeat','probe','incident'].includes(current.kind),'NEW_CONTROL_PLANE_AUTHORITY');assert.ok(validTime(current.at));
  if(current.kind==='incident'){assertValidAttempts(current.attempts);assert.equal(current.attempts,0,'NEW_RECOVERY_ATTEMPT');assert.ok(['DETECTED','UNRESOLVED'].includes(current.status));assert.ok(validTime(current.firstAt)&&current.firstAt<=current.at);assert.ok(Number.isSafeInteger(current.recurrence)&&current.recurrence>=1);assert.ok(current.limitation===null||current.limitation==='No permitted recovery runbook');}
 });
}

// No coercion and no negative zero: preserve the actual numeric source contract.
function assertValidAttempts(value){
 assert.ok(Number.isSafeInteger(value)&&value>=0&&!Object.is(value,-0),'INVALID_RECOVERY_ATTEMPT_COUNTER');
}

export function recoveryActivity(rows){
 return Object.fromEntries(['RECOVERY_ADMITTED','RECOVERY_RESULT'].map(type=>[type,rows.filter(r=>r.type===type).map(r=>sha(json(r))).sort()]));
}

export function checkRecoveryActivity(prior,current,context={}){
 for(const eventType of ['RECOVERY_ADMITTED','RECOVERY_RESULT']){
  const before=prior[eventType],after=current[eventType];
  assert.ok(Array.isArray(before)&&Array.isArray(after),'RECOVERY_ACTIVITY_INVENTORY_REQUIRED');
  try{assert.deepEqual(after,before,'NEW_RECOVERY_ACTIVITY');}
  catch(error){
   error.assuranceActivityContext={schema:'work8-v111-assurance-activity-context-v1',domain:'assurance',store:'cp_events',invariant:'NEW_RECOVERY_ACTIVITY',
    eventType,priorCount:before.length,observedCount:after.length,priorSha256:sha(json(before)),observedSha256:sha(json(after)),
    readbackPhase:context.readbackPhase,checkerSha256:context.checkerSha256,rawEventsRetained:false,applicationAcceptance:false};
   throw error;
  }
 }
}
