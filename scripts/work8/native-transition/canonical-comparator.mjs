import {createHash} from 'node:crypto';
import normalSchema from './normal-schema.json' with {type:'json'};
import recoverySchema from './recovery-schema.json' with {type:'json'};

// Harness-only acceptance profile. No application clock, guard or policy changes.
export const jsonDigest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const digest = value => jsonDigest(value === undefined ? {type:'undefined'} : value);
const ordered = v => Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,ordered(v[k])])):v;
const equal = (a,b) => JSON.stringify(ordered(a)) === JSON.stringify(ordered(b));
const kind = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
const time = v => typeof v === 'string' ? Date.parse(v) : v;
const safeValues = new Set(['WAITING_SIMULATED_PAYOUT_OR_EVENT','IN_PROGRESS','COMPLETE_SIMULATION','INCOMPLETE_SIMULATION','REVOKED','PAUSED','NOT_GRANTED','LOCKED','NOT_BORN','SIMULATION','SIMULATION_EXCLUDED_FROM_ACTUALS','SYNTHETIC','SANDBOX','PASS','FAIL']);
const sourceKeys=new Set([...Object.keys(normalSchema.paths),...Object.keys(recoverySchema.paths)].flatMap(p=>p.split('.').map(x=>x.replaceAll('[]',''))).filter(k=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(k)));
for(const key of ['canonical','tables','table','scopeSha256','count','rowsSha256','sessionDigest','authorityDigest','plan','createdAt','sourceDigest','assumptions','events'])sourceKeys.add(key);
const clockPath = p => /^\$\.records\[\d+\]\.finance\.(status|financial\.cutoffAt)$/.test(p) || /^\$\.assurance\.probes\[\d+\]\.evidence\.observedAt$/.test(p);
function classification(p) {
 if(clockPath(p))return 'CLOCK_DERIVED_PRESENTATION';
 if(p.startsWith('$.persistence'))return 'CANONICAL_PERSISTED';
 if(/^\$\.(session|authority|preparationAuthority|recoveredAuthorityAudit|tasks|assurance\.observations)/.test(p))return 'CANONICAL_CONTROL_OR_PERSISTED_PROJECTION';
 if(p.includes('.finance.financial.')||p.includes('.simulatedCharges')||p.startsWith('$.assurance.probes'))return 'DERIVED_FROM_CANONICAL_SOURCE';
 return 'CANONICAL_OR_EXACT_SOURCE_BOUND_PRESENTATION';
}
function safePath(path,key) {
 // Dynamic object keys can be arbitrary business identifiers; their complete hash
 // locates the exact key without publishing it. Source-defined keys stay readable.
 return sourceKeys.has(key)&&!/^\$\.records\[\d+\]\.orders$/.test(path) ? path+'.'+key : path+'[key-sha256:'+digest(key)+']';
}
function walk(value,fn,path='$',schemaPath='$') {
 fn(value,path,schemaPath);
 if(Array.isArray(value))value.forEach((v,i)=>walk(v,fn,path+'['+i+']',schemaPath+'[]'));
 else if(value&&typeof value==='object')for(const [key,v]of Object.entries(value))walk(v,fn,safePath(path,key),schemaPath+(['$.records[].orders','$.records[].orders.*.shipments'].includes(schemaPath)?'.*':'.'+key));
}
function schemaCheck(value,schema,issue) {
 walk(value,(v,path,shape)=>{
  const allowed=schema.paths[shape];
  if(!allowed)issue('UNCLASSIFIED_SCHEMA_FIELD',path,undefined,v,'UNCLASSIFIED_REJECTED');
  else if(!allowed.includes(kind(v)))issue('SCHEMA_TYPE_CHANGED',path,allowed,kind(v),'UNCLASSIFIED_REJECTED');
  if(v&&kind(v)==='object'&&schema.objectKeyVariants[shape]) {
   const keys=Object.keys(v).sort();
   if(!schema.objectKeyVariants[shape].some(required=>equal(required,keys)))issue('MANDATORY_SCHEMA_KEYS_CHANGED',path,schema.objectKeyVariants[shape],keys,'UNCLASSIFIED_REJECTED');
  }
 });
}
function compareExact(a,b,issue,path='$') {
 if(equal(a,b))return;
 if(kind(a)!==kind(b)||a===null||b===null||typeof a!=='object')return issue('VALUE_CHANGED',path,a,b);
 if(Array.isArray(a)) {
  if(a.length!==b.length)issue('ARRAY_LENGTH_CHANGED',path+'.length',a.length,b.length);
  for(let i=0;i<Math.max(a.length,b.length);i++)compareExact(a[i],b[i],issue,path+'['+i+']');
 } else for(const key of new Set([...Object.keys(a),...Object.keys(b)]))compareExact(a[key],b[key],issue,safePath(path,key));
}
function sessionScope(snapshot,persistence,issue) {
 const canonical=persistence?.canonical;
 if(!canonical||!Array.isArray(persistence?.finance))issue('PERSISTENCE_INPUT_MISSING','$.persistence',true,false);
 if(canonical?.sessionId!==snapshot.session?.sessionId)issue('SESSION_PERSISTENCE_MISMATCH','$.session.sessionId',canonical?.sessionId,snapshot.session?.sessionId);
 if(canonical?.sessionDigest!==snapshot.session?.digest)issue('SESSION_DIGEST_MISMATCH','$.session.digest',canonical?.sessionDigest,snapshot.session?.digest);
 if(canonical?.authorityDigest!==snapshot.authority?.grant?.digest)issue('AUTHORITY_DIGEST_MISMATCH','$.authority.grant.digest',canonical?.authorityDigest,snapshot.authority?.grant?.digest);
 const s=snapshot.session;
 if(s&&'twin_'+digest({workspace:s.workspace,owner:s.owner,sessionId:s.sessionId}).slice(0,48)!==s.twinWorkspace)issue('OWNER_WORKSPACE_NAMESPACE_MISMATCH','$.session.twinWorkspace',true,false);
 if(s&&digest(Object.fromEntries(Object.entries(s).filter(([k])=>k!=='digest')))!==s.digest)issue('SESSION_CHAIN_DIGEST_INVALID','$.session.digest',true,false);
 const grant=snapshot.authority?.grant;
 if(grant&&digest(Object.fromEntries(Object.entries(grant).filter(([k])=>k!=='digest')))!==grant.digest)issue('AUTHORITY_CHAIN_DIGEST_INVALID','$.authority.grant.digest',true,false);
}
function validateNormal(snapshot,observation,persistence,issue,observations,phase) {
 schemaCheck(snapshot,normalSchema,issue);sessionScope(snapshot,persistence,issue);
 const require=(condition,code,path,expected,actual)=>{if(!condition)issue(code,path,expected,actual);};
 const start=observation?.startedAtMs,end=observation?.completedAtMs;
 require(Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>0&&start<=end&&end-start<=60000,'INVALID_READ_INTERVAL','$.observation',true,false);
 require(snapshot.schema==='WORK8_TWIN_PROJECTION_V1','SCHEMA_IDENTITY_CHANGED','$.schema','WORK8_TWIN_PROJECTION_V1',snapshot.schema);
 require(snapshot.session?.status==='PAUSED'&&snapshot.session?.version===3,'SESSION_NOT_FROZEN','$.session.status','PAUSED',snapshot.session?.status);
 require(snapshot.authority?.status==='REVOKED'&&snapshot.authority?.version===2&&snapshot.authority?.grant?.action==='REVOKE','AUTHORITY_NOT_REVOKED','$.authority.status','REVOKED',snapshot.authority?.status);
 require(snapshot.liveCommerce==='LOCKED'&&snapshot.birth==='NOT_BORN'&&snapshot.actualCashMovement===0,'SAFETY_STATE_CHANGED','$.liveCommerce','LOCKED',snapshot.liveCommerce);
 require(snapshot.next===null&&snapshot.records?.length===2,'ACCEPTANCE_DATASET_INCOMPLETE','$.records.length',2,snapshot.records?.length);
 require(snapshot.communications?.length===0,'UNREVIEWED_CLOCK_DEPENDENT_COMMUNICATION','$.communications.length',0,snapshot.communications?.length);
 require(snapshot.preparationAuthority?.every(x=>x.status==='NOT_GRANTED'&&x.grant===null),'PREPARATION_AUTHORITY_NOT_EMPTY','$.preparationAuthority',true,false);
 const plans=persistence?.finance??[];
 require(plans.length===snapshot.records?.length,'PERSISTED_PLAN_COUNT_MISMATCH','$.persistence.finance.length',snapshot.records?.length,plans.length);
 for(const [i,record]of(snapshot.records??[]).slice(0,16).entries()) {
  const root='$.records['+i+']',f=record.finance,p=plans.find(x=>x.missionId===record.missionId);
  if(!p?.plan||!Array.isArray(p.events)){issue('PERSISTED_PLAN_MISSING',root+'.finance.planDigest',true,false);continue;}
  const plan=p.plan,cutoff=time(f?.financial?.cutoffAt),n=p.events.length,next=plan.events?.[n],threshold=next?time(next.at):null;
  require(plan.mission===record.missionId&&plan.workspace===snapshot.session.twinWorkspace&&plan.sourceDigest===f?.sourceReceiptDigest,'PLAN_SCOPE_MISMATCH',root+'.finance.sourceReceiptDigest',plan.sourceDigest,f?.sourceReceiptDigest);
  require(digest(plan)===p.planDigest&&p.planDigest===f?.planDigest,'PLAN_DIGEST_MISMATCH',root+'.finance.planDigest',digest(plan),f?.planDigest);
  require(equal(f?.events,p.events),'COMMITTED_EVENTS_MISMATCH',root+'.finance.events',p.events,f?.events);
  require(equal(f?.assumptions,plan.assumptions),'PLAN_ASSUMPTIONS_CHANGED',root+'.finance.assumptions',plan.assumptions,f?.assumptions);
  require(equal(p.events,plan.events?.slice(0,n)),'COMMITTED_EVENT_PREFIX_MISMATCH',root+'.finance.events',plan.events?.slice(0,n),p.events);
  require(f?.recordedEvents===n&&f?.totalEvents===plan.events?.length&&f?.lifecycleComplete===(n===plan.events?.length),'FINANCE_COUNTS_MISMATCH',root+'.finance.recordedEvents',n,f?.recordedEvents);
  require(Number.isFinite(cutoff)&&cutoff>=start&&cutoff<=end,'CUTOFF_OUTSIDE_READ_INTERVAL',root+'.finance.financial.cutoffAt',true,false);
  require(p.events.every(e=>Number.isFinite(time(e.at))&&time(e.at)<=cutoff),'COMMITTED_EVENT_AFTER_CUTOFF',root+'.finance.financial.pending',[],f?.financial?.pending);
  require(Array.isArray(f?.financial?.pending)&&f.financial.pending.length===0,'UNREVIEWED_PENDING_FINANCIAL_EVENT',root+'.finance.financial.pending',[],f?.financial?.pending);
  // zod's strict event schema emits this source-defined key order before hashing.
  const projectedEvents=p.events.map(e=>({id:e.id,orderId:e.orderId,sourceReceiptDigest:e.sourceReceiptDigest,kind:e.kind,currency:e.currency,minor:e.minor,at:e.at,classification:e.classification,...(e.assumptionRef===undefined?{}:{assumptionRef:e.assumptionRef})}));
  require(digest(projectedEvents)===f?.financial?.eventDigest,'FINANCIAL_EVENT_DIGEST_MISMATCH',root+'.finance.financial.eventDigest',digest(projectedEvents),f?.financial?.eventDigest);
  let expectedStatus;
  if(n===plan.events?.length)expectedStatus='COMPLETE_SIMULATION';
  else if(!Number.isFinite(threshold))issue('INVALID_PLANNED_THRESHOLD',root+'.finance.status',true,false);
  else if(threshold<=cutoff)expectedStatus='IN_PROGRESS';
  else if(threshold>end)expectedStatus='WAITING_SIMULATED_PAYOUT_OR_EVENT';
  else issue('AMBIGUOUS_STATUS_READ_INTERVAL',root+'.finance.status',undefined,f?.status,'CLOCK_DERIVED_PRESENTATION');
  if(expectedStatus!==undefined)require(f?.status===expectedStatus,'INCORRECT_DERIVED_FINANCE_STATUS',root+'.finance.status',expectedStatus,f?.status);
  observations.push({phase,recordIndex:i,missionSha256:digest(record.missionId),displayedStatus:safeValues.has(f?.status)?f.status:null,verifiedStatus:expectedStatus??null,requestStartedAtMs:start,financialCutoffAtMs:cutoff,requestCompletedAtMs:end,nextPlannedEventAtMs:threshold,planSha256:digest(plan),committedEventsSha256:digest(p.events),sourceReceiptSha256:digest(plan.sourceDigest)});
 }
 for(const [i,probe]of(snapshot.assurance?.probes??[]).entries())require(Number.isSafeInteger(probe.evidence?.observedAt)&&probe.evidence.observedAt>=start&&probe.evidence.observedAt<=end,'PROBE_TIME_OUTSIDE_READ_INTERVAL','$.assurance.probes['+i+'].evidence.observedAt',true,false);
 const canonical=structuredClone(snapshot);
 for(const r of canonical.records??[]){delete r.finance.status;delete r.finance.financial.cutoffAt;}
 for(const p of canonical.assurance?.probes??[])delete p.evidence.observedAt;
 return canonical;
}

/** All inputs remain private. Returned receipt contains only bounded safe diagnostics. */
export function compareSnapshots({expected,observed,expectedObservation,observedObservation,expectedPersistence,observedPersistence,sourceIdentity}) {
 const diagnostics=[],observations=[];let totalIssues=0;
 const issue=(code,path,a,b,category=classification(path))=>{
  totalIssues++;
  if(diagnostics.length<32)diagnostics.push({code,path,classification:category,expectedSha256:digest(a),observedSha256:digest(b),...(safeValues.has(a)?{expectedValue:a}:{}),...(safeValues.has(b)?{observedValue:b}:{})});
 };
 let left,right;
 try {
  left=validateNormal(expected,expectedObservation,expectedPersistence,issue,observations,'NORMAL');
  right=validateNormal(observed,observedObservation,observedPersistence,issue,observations,'RETURNED_NORMAL');
  compareExact(expectedPersistence,observedPersistence,issue,'$.persistence');
  compareExact(left,right,issue);
 } catch(error) {issue('INVALID_COMPARATOR_INPUT','$',true,false,'UNCLASSIFIED_REJECTED');}
 const persistenceEqual=equal(expectedPersistence,observedPersistence),canonicalEqual=left!==undefined&&right!==undefined&&equal(left,right)&&persistenceEqual;
 return {schema:'WORK8_V28_CANONICAL_COMPARISON_V1',pass:totalIssues===0,canonicalEqual,persistenceEqual,canonicalSha256:left?digest(ordered(left)):null,observedCanonicalSha256:right?digest(ordered(right)):null,persistenceSha256:digest(ordered(expectedPersistence)),observedPersistenceSha256:digest(ordered(observedPersistence)),sourceIdentitySha256:digest(sourceIdentity),diagnostics,totalIssues,diagnosticsTruncated:totalIssues>diagnostics.length,observations,independentReview:'REQUIRED_BEFORE_ACCEPTANCE'};
}

export function validateRecoverySchema(value) {
 const diagnostics=[];schemaCheck(value,recoverySchema,(code,path,a,b,classification)=>diagnostics.push({code,path,classification,expectedSha256:digest(a),observedSha256:digest(b)}));
 return {pass:diagnostics.length===0,diagnostics:diagnostics.slice(0,32)};
}
