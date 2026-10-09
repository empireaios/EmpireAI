import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID,createHash} from 'node:crypto';
import {operatingScopeDisposition,scopeHistoryCompatible} from './operating-scope.mjs';
import {historicalProviderDisposition,historicalProviderHistoryCompatible} from './historical-provider.mjs';
const key=x=>typeof x==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(x);
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const statuses=new Set(['HEALTHY','DEGRADED','FAILED','NOT_APPLICABLE','EXTERNALLY_BLOCKED','UNAVAILABLE','STALE','NOT_CHECKED','UNVERIFIED','BLOCKED','NOT_INSTALLED']);
const terminal=new Set(['CLOSED','RECOVERED']);
const safe=x=>JSON.parse(JSON.stringify(x??null));
/** Additive operational state. Callers authenticate actors; this engine scopes and fences every operation. */
export class AssuranceControlPlane {
 constructor({root,now=Date.now,revision,runbooks={},deploymentVerifier=null}){
  if(!path.isAbsolute(root)||fs.realpathSync(root)!==root||!key(revision))throw Error('CONTROL_PLANE_CONFIGURATION');
  this.now=now;this.revision=revision;this.deploymentVerifier=deploymentVerifier;this.runbooks=Object.freeze({...runbooks});
  for(const [id,r]of Object.entries(runbooks))if(!key(id)||!key(r.version)||!['A','B','C'].includes(r.authority)||!key(r.capability)||!Number.isInteger(r.maxAttempts)||r.maxAttempts<1||r.maxAttempts>10||!Number.isInteger(r.cooldownMs)||r.cooldownMs<0||!Number.isInteger(r.timeoutMs)||r.timeoutMs<1||r.timeoutMs>60000||typeof r.execute!=='function'||typeof r.verify!=='function')throw Error('RUNBOOK_CONTRACT');
  const filename=path.join(root,'assurance.sqlite');if(fs.existsSync(filename)&&(fs.realpathSync(filename)!==filename||!fs.lstatSync(filename).isFile()))throw Error('CONTROL_PLANE_PATH');
  this.db=new DatabaseSync(filename,{timeout:1000,allowExtension:false});
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA trusted_schema=OFF;
   CREATE TABLE IF NOT EXISTS cp_records(workspace TEXT NOT NULL,kind TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(workspace,kind,id)) STRICT;
   CREATE TABLE IF NOT EXISTS cp_events(seq INTEGER PRIMARY KEY AUTOINCREMENT,workspace TEXT NOT NULL,at INTEGER NOT NULL,type TEXT NOT NULL,body TEXT NOT NULL) STRICT;
   CREATE INDEX IF NOT EXISTS cp_event_workspace ON cp_events(workspace,seq);
   CREATE TRIGGER IF NOT EXISTS cp_event_no_update BEFORE UPDATE ON cp_events BEGIN SELECT RAISE(ABORT,'IMMUTABLE_EVENT'); END;
   CREATE TRIGGER IF NOT EXISTS cp_event_no_delete BEFORE DELETE ON cp_events BEGIN SELECT RAISE(ABORT,'IMMUTABLE_EVENT'); END;`);
 }
 close(){this.db.close();}
 scope(w){if(!key(w))throw Error('WORKSPACE_REQUIRED');return w;}
 get(w,k,id){this.scope(w);const r=this.db.prepare('SELECT body FROM cp_records WHERE workspace=? AND kind=? AND id=?').get(w,k,id);return r?JSON.parse(r.body):null;}
 list(w,k){this.scope(w);return this.db.prepare('SELECT body FROM cp_records WHERE workspace=? AND kind=? ORDER BY id').all(w,k).map(r=>JSON.parse(r.body));}
 put(w,k,id,b){const raw=JSON.stringify(b);if(raw.length>65536)throw Error('RECORD_BOUND');this.db.prepare('INSERT INTO cp_records VALUES(?,?,?,?) ON CONFLICT(workspace,kind,id) DO UPDATE SET body=excluded.body').run(this.scope(w),k,id,raw);return b;}
 event(w,type,body){this.db.prepare('INSERT INTO cp_events(workspace,at,type,body) VALUES(?,?,?,?)').run(this.scope(w),this.now(),type,JSON.stringify(body));}
 tx(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 heartbeat(w,component='monitor'){if(!key(component))throw Error('COMPONENT');this.put(w,'heartbeat',component,{component,at:this.now(),revision:this.revision});}
 observe(w,p){
  this.scope(w);if(!key(p.id)||!key(p.capability)||!statuses.has(p.status)||typeof p.summary!=='string'||p.summary.length>1000||JSON.stringify(p.evidence??null).length>12000)throw Error('PROBE_CONTRACT');
  if(p.synthetic===true&&!w.startsWith('synthetic:'))throw Error('SYNTHETIC_ISOLATION');
  return this.tx(()=>{const probe={...safe(p),observedAt:this.now(),revision:this.revision};this.put(w,'probe',p.id,probe);
   const fingerprint=hash([p.capability,p.classification??'UNKNOWN',p.id,this.revision]);
   let incident=this.list(w,'incident').find(i=>i.fingerprint===fingerprint&&!terminal.has(i.status));
   const historical=historicalProviderDisposition(w,probe,p.scopeContext,this.now());
   if(historical&&this.get(w,'lease','production')?.status!=='ACTIVE'&&!this.get(w,'setting','pause')?.paused){
    const recoveries=this.list(w,'recovery');
    for(const prior of this.list(w,'incident').filter(i=>i.probeId===p.id&&i.capability===p.capability&&i.classification===p.classification&&!terminal.has(i.status))){
     if(recoveries.some(r=>r.incidentId===prior.id&&['RUNNING','UNKNOWN'].includes(r.status)))continue;
     const history=this.db.prepare("SELECT seq,at,body FROM cp_events WHERE workspace=? AND ((type='INCIDENT_DETECTED' AND json_extract(body,'$.incident.id')=?) OR (type='INCIDENT_OBSERVED' AND json_extract(body,'$.incidentId')=?)) ORDER BY seq LIMIT 5001").all(w,prior.id,prior.id).map(e=>({...e,body:JSON.parse(e.body)}));
     if(!historicalProviderHistoryCompatible(history))continue;
     const previousStatus=prior.status,historyEvidence={count:history.length,firstSeq:history[0].seq,lastSeq:history.at(-1).seq,sha256:hash(history)};
     prior.status='CLOSED';prior.closedAt=this.now();prior.historicalDisposition={...historical,historyEvidence};prior.dispositionRevision=this.revision;
     this.put(w,'incident',prior.id,prior);
     this.event(w,'HISTORICAL_PROVIDER_ADMINISTRATIVELY_RESOLVED',{incidentId:prior.id,originalFingerprint:prior.fingerprint,originalSeverity:prior.severity,previousStatus,probe,historical,historyEvidence});
    }
    return probe;
   }
   const scope=operatingScopeDisposition(probe,p.scopeContext,this.now());
   if(scope&&this.get(w,'lease','production')?.status!=='ACTIVE'&&!this.get(w,'setting','pause')?.paused){
    const recoveries=this.list(w,'recovery');
    for(const prior of this.list(w,'incident').filter(i=>i.probeId===p.id&&i.capability===p.capability&&i.classification===p.classification&&!terminal.has(i.status))){
     if(recoveries.some(r=>r.incidentId===prior.id&&['RUNNING','UNKNOWN'].includes(r.status)))continue;
     const history=this.db.prepare("SELECT seq,at,body FROM cp_events WHERE workspace=? AND ((type='INCIDENT_DETECTED' AND json_extract(body,'$.incident.id')=?) OR (type='INCIDENT_OBSERVED' AND json_extract(body,'$.incidentId')=?)) ORDER BY seq LIMIT 5001").all(w,prior.id,prior.id).map(e=>({...e,body:JSON.parse(e.body)}));
     if(!scopeHistoryCompatible(history,probe))continue;
     const previousStatus=prior.status;
     const historyEvidence={count:history.length,firstSeq:history[0].seq,lastSeq:history.at(-1).seq,sha256:hash(history)};
     prior.status='CLOSED';prior.closedAt=this.now();prior.scopeDisposition={...scope,historyEvidence};prior.dispositionRevision=this.revision;
     this.put(w,'incident',prior.id,prior);
     this.event(w,'INCIDENT_SCOPE_RECONCILED',{incidentId:prior.id,originalFingerprint:prior.fingerprint,originalSeverity:prior.severity,previousStatus,probe,scope,historyEvidence});
    }
    return probe;
   }
   if(p.status==='HEALTHY'){
    // Current affirmative evidence may resolve the same monitored capability
    // across revisions. Preserve original incident identity and immutable events;
    // do not resolve an in-flight or unknown recovery outcome from probe health.
    for(const prior of this.list(w,'incident').filter(i=>i.probeId===p.id&&i.capability===p.capability&&i.classification===(p.classification??'UNKNOWN')&&!terminal.has(i.status))){
     if(this.list(w,'recovery').some(r=>r.incidentId===prior.id&&['RUNNING','UNKNOWN'].includes(r.status)))continue;
     prior.status='RECOVERED';prior.verifiedAt=this.now();prior.closedAt=this.now();prior.verificationRevision=this.revision;this.put(w,'incident',prior.id,prior);this.event(w,'FUNCTION_VERIFIED',{incidentId:prior.id,probe});
    }return probe;
   }
   if(p.status==='NOT_INSTALLED')return probe;
   if(!incident){incident={id:'inc_'+randomUUID(),fingerprint,probeId:p.id,capability:p.capability,classification:p.classification??'UNKNOWN',severity:p.severity??'HIGH',summary:p.summary,status:'DETECTED',firstAt:this.now(),lastAt:this.now(),revision:this.revision,runbookId:p.runbookId??null,recurrence:1,attempts:0,synthetic:w.startsWith('synthetic:')};this.event(w,'INCIDENT_DETECTED',{incident,probe});}
   else{incident.lastAt=this.now();incident.recurrence++;this.event(w,'INCIDENT_OBSERVED',{incidentId:incident.id,probe});}
   this.put(w,'incident',incident.id,incident);return incident;});
 }
 snapshot(w){
  const now=this.now(),incidents=this.list(w,'incident'),heart=this.get(w,'heartbeat','monitor');
  const fresh=Boolean(heart&&heart.revision===this.revision&&heart.at<=now&&now-heart.at<=90000);
  const components=this.list(w,'probe').map(p=>{
   if(p.id==='approval_quarantine'){
    const accepted=this.list(w,'acceptance_history').find(a=>a.mode==='OWNER_APPROVAL'&&a.completed&&a.incidentId&&incidents.some(i=>i.id===a.incidentId&&i.status==='RECOVERED'));
    const recovery=accepted&&this.get(w,'recovery',accepted.recoveryId);
    if(recovery?.status==='VERIFIED'&&recovery.ownerApprovalActor)return {...p,status:'HEALTHY',summary:'Completed one-shot owner approval acceptance; retained recovery verified',evidenceScope:'HISTORICAL_ACCEPTANCE_NOT_RECURRING_HEALTH',verifiedAt:accepted.verifiedAt,recoveryId:recovery.id};
   }
   return {...p,status:now-p.observedAt>180000&&p.status!=='NOT_INSTALLED'?'STALE':p.status};
  });
  const active=incidents.filter(i=>!terminal.has(i.status));
  return {schema:'assurance-control-plane-v1',observedAt:now,revision:this.revision,status:!fresh?'STALE':active.length||components.some(c=>!['HEALTHY','NOT_INSTALLED'].includes(c.status))?'DEGRADED':components.length?'HEALTHY':'NOT_CHECKED',summary:{activeIncidents:active.length,automaticallyRecovered:incidents.filter(i=>i.status==='RECOVERED'&&i.attempts>0).length,ownerActionRequired:active.filter(i=>i.status==='OWNER_ACTION_REQUIRED').length},commands:this.list(w,'command').slice(-50),paused:this.get(w,'setting','pause')??{paused:false},components,incidents,recoveries:this.list(w,'recovery'),approvals:this.list(w,'approval'),lease:this.get(w,'lease','production'),events:this.db.prepare('SELECT seq,at,type,body FROM cp_events WHERE workspace=? ORDER BY seq DESC LIMIT 100').all(w).map(e=>({...e,body:JSON.parse(e.body)})),checkpoints:this.list(w,'checkpoint'),monitor:{fresh,heartbeat:heart}};
 }
 async bounded(fn,context,ms){let timer;const controller=new AbortController();try{return await Promise.race([Promise.resolve().then(()=>fn({...context,signal:controller.signal})),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('OUTCOME_UNKNOWN'));},ms);})]);}finally{clearTimeout(timer);}}
 async tick(w){
  this.scope(w);this.heartbeat(w);
  for(const i of this.list(w,'incident'))if(!terminal.has(i.status)&&this.runbooks[i.runbookId]?.executor!=='API_ADVISOR')await this.recover(w,i.id);
  return this.snapshot(w);
 }
 async recover(w,id,{actor='assurance'}={}){
  if(!key(actor))throw Error('ACTOR_REQUIRED');
  let operation,incident,runbook;
  const admission=this.tx(()=>{
   incident=this.get(w,'incident',id);if(!incident||terminal.has(incident.status))return 'NOT_ELIGIBLE';
   runbook=this.runbooks[incident.runbookId];
   if(!runbook||runbook.capability!==incident.capability||runbook.authority==='C'){incident.status='UNRESOLVED';incident.limitation='No permitted recovery runbook';this.put(w,'incident',id,incident);return 'NO_RUNBOOK';}
   if(runbook.executor==='API_ADVISOR'&&actor!=='API_ADVISOR')return 'EXECUTOR_MISMATCH';
   if(incident.revision!==this.revision)return 'REVISION_CHANGED';
   const old=this.list(w,'recovery').find(r=>r.incidentId===id&&['RUNNING','UNKNOWN'].includes(r.status));
   if(old){operation=old;return old.status==='RUNNING'&&old.deadlineAt>this.now()?'RUNNING':'RECONCILE';}
   if(this.get(w,'setting','pause')?.paused)return 'PAUSED';
   const lease=this.get(w,'lease','production');if(lease&&lease.status==='ACTIVE'){if(incident.deferredLeaseId!==lease.id){incident.deploymentDeferredAt=this.now();incident.deferredLeaseId=lease.id;this.event(w,'DEPLOYMENT_RECOVERY_DEFERRED',{incidentId:id,leaseId:lease.id,fence:lease.fence,revision:this.revision});}incident.status='DEFERRED';this.put(w,'incident',id,incident);return lease.expiresAt<=this.now()?'LEASE_RECONCILIATION_REQUIRED':'DEPLOYMENT_CONFLICT';}
   if(incident.attempts>=runbook.maxAttempts){incident.status='UNRESOLVED';incident.limitation='Recovery attempt budget exhausted';this.put(w,'incident',id,incident);return 'CIRCUIT_OPEN';}
   if(incident.lastAttemptAt&&this.now()-incident.lastAttemptAt<runbook.cooldownMs)return 'COOLDOWN';
   let approval=null;
   if(runbook.authority==='B'){
    for(const expired of this.list(w,'approval').filter(a=>a.incidentId===id&&!a.consumed&&['PENDING','DEFERRED','APPROVED'].includes(a.decision)&&a.expiresAt<=this.now())){expired.decision='EXPIRED';expired.expiredAt=this.now();this.put(w,'approval',expired.id,expired);this.event(w,'APPROVAL_EXPIRED',expired);}
    approval=this.list(w,'approval').find(a=>a.incidentId===id&&a.revision===this.revision&&a.runbookVersion===runbook.version&&a.decision==='APPROVED'&&!a.consumed&&a.expiresAt>this.now());
    if(!approval){const existing=this.list(w,'approval').find(a=>a.incidentId===id&&['PENDING','REJECTED','DEFERRED','REVOKED'].includes(a.decision));
     if(!existing){const a={id:'apr_'+randomUUID(),incidentId:id,runbookId:incident.runbookId,runbookVersion:runbook.version,revision:this.revision,decision:'PENDING',createdAt:this.now(),expiresAt:this.now()+3600000,consumed:false,title:runbook.title??incident.summary,proposedAction:runbook.description??('Execute reviewed runbook '+incident.runbookId+' version '+runbook.version),approvalReason:runbook.approvalReason??'This operational recovery requires a specific owner decision.',impact:incident.summary,alreadyDone:'Fault detected and original evidence retained; no owner-controlled recovery has executed.',consequences:runbook.consequences??{approve:'Execute this scoped recovery once, then independently verify the affected capability.',reject:'Do not execute this recovery; preserve the incident and safe containment.',defer:'Keep the incident open and defer this recovery.',inaction:'No owner-controlled recovery executes; the affected capability may remain degraded.'}};this.put(w,'approval',a.id,a);this.event(w,'APPROVAL_REQUESTED',a);}
     incident.status='OWNER_ACTION_REQUIRED';this.put(w,'incident',id,incident);return 'OWNER_ACTION_REQUIRED';}
   }
   operation={id:'rec_'+randomUUID(),incidentId:id,runbookId:incident.runbookId,runbookVersion:runbook.version,authority:runbook.authority,revision:this.revision,status:'RUNNING',startedAt:this.now(),deadlineAt:this.now()+2*runbook.timeoutMs,idempotencyKey:hash([w,id,incident.attempts]),actor,ownerApprovalActor:approval?.ownerId??null,approvalId:approval?.id??null};
   if(approval){approval.consumed=true;approval.operationId=operation.id;this.put(w,'approval',approval.id,approval);}
   incident.attempts++;incident.lastAttemptAt=this.now();incident.status='RECOVERY_RUNNING';this.put(w,'incident',id,incident);this.put(w,'recovery',operation.id,operation);this.event(w,'RECOVERY_ADMITTED',operation);return 'EXECUTE';
  });
  if(!['EXECUTE','RECONCILE'].includes(admission))return {status:admission};
  const context={workspace:w,incident:safe(incident),operation:safe(operation),revision:this.revision};
  try{
   if(admission==='RECONCILE'){
    if(!runbook.reconcile)throw Error('OUTCOME_UNKNOWN');
    const result=await this.bounded(runbook.reconcile,context,runbook.timeoutMs);
    if(result?.completed!==true)throw Error('OUTCOME_UNKNOWN');operation.result=safe(result);
   }else operation.result=safe(await this.bounded(runbook.execute,context,runbook.timeoutMs));
   const verified=await this.bounded(runbook.verify,{...context,result:operation.result},runbook.timeoutMs);
   if(verified?.healthy!==true){operation.status='FAILED';operation.verification=safe(verified);incident.status='DEGRADED';}
   else{operation.status='VERIFIED';operation.verification=safe(verified);incident.status='RECOVERED';incident.closedAt=this.now();incident.verifiedAt=this.now();}
  }catch(e){operation.status='UNKNOWN';operation.error=e?.message==='OUTCOME_UNKNOWN'?'OUTCOME_UNKNOWN':'RUNBOOK_ERROR_OUTCOME_UNKNOWN';incident.status='UNRESOLVED';}
  operation.completedAt=this.now();this.tx(()=>{this.put(w,'recovery',operation.id,operation);this.put(w,'incident',id,incident);this.event(w,'RECOVERY_RESULT',operation);});return operation;
 }
 async command(w,ownerId,c){
  this.scope(w);if(!key(ownerId)||!c||!key(c.id)||!key(c.type))throw Error('AUTHENTICATED_COMMAND_REQUIRED');
  const digest=hash({ownerId,...c});const prior=this.get(w,'command',c.id);if(prior){if(prior.digest!==digest)throw Error('COMMAND_REPLAY_CONFLICT');return prior;}
  let follow=false;
  const candidate=this.get(w,'lease','production');
  const reconcile=c.type==='lease_reconcile'||(c.type==='lease_finish'&&candidate?.expiresAt<=this.now());
  let deploymentEvidence=null,verificationFailure=null;
  if(reconcile&&candidate?.status==='ACTIVE'&&candidate.ownerId===ownerId&&candidate.id===c.leaseId&&candidate.fence===c.fence&&candidate.expiresAt<=this.now()&&typeof this.deploymentVerifier==='function'){try{deploymentEvidence=await this.deploymentVerifier({workspace:w,ownerId,lease:safe(candidate),revision:this.revision});}catch(error){const stages=new Set(['RAILWAY_AUTH','RAILWAY_READ','VERCEL_ALIAS','VERCEL_HISTORY']);const codes=new Set(['AUTHORIZATION_DENIED','TOKEN_SCOPE_MISMATCH','GRAPHQL_PARSE_FAILED','GRAPHQL_VALIDATION_FAILED','BAD_USER_INPUT','INTERNAL_SERVER_ERROR','API_ERROR','TIMEOUT','RESPONSE_OR_NETWORK_ERROR','DEPLOYMENT_VERIFIER_UNCONFIGURED','DEPLOYMENT_SCOPE_INVALID','PLATFORM_COVERAGE_UNKNOWN','PLATFORM_COVERAGE_BOUND','DEPLOYMENT_IN_PROGRESS','DEPLOYMENT_IDENTITY_MISMATCH','DEPLOYMENT_EVIDENCE_STALE']);const raw=error?.diagnostic?.code??error?.message;verificationFailure={stage:stages.has(error?.diagnostic?.stage)?error.diagnostic.stage:'VERIFIER',code:codes.has(raw)||/^HTTP_[1-5][0-9]{2}$/.test(raw??'')?raw:'UNCLASSIFIED'};}}
  const receipt=this.tx(()=>{const existing=this.get(w,'command',c.id);if(existing){if(existing.digest!==digest)throw Error('COMMAND_REPLAY_CONFLICT');return existing;}let result={status:'ACTION_DENIED',reason:'UNKNOWN_COMMAND'};const now=this.now();
   if(c.type==='health_check')result={status:'ACCEPTED',reason:'Deterministic monitoring requested'};
   if(['pause','resume'].includes(c.type)){this.put(w,'setting','pause',{paused:c.type==='pause',ownerId,at:now,reason:String(c.reason??'Owner decision').slice(0,500)});follow=c.type==='resume';result={status:'ACCEPTED'};}
   if(['approve','reject','defer'].includes(c.type)){const a=this.get(w,'approval',c.approvalId);if(!a||!['PENDING','DEFERRED'].includes(a.decision)||a.consumed||a.revision!==this.revision||a.expiresAt<=now)result={status:'ACTION_DENIED',reason:'APPROVAL_STALE_OR_INVALID'};else{a.decision={approve:'APPROVED',reject:'REJECTED',defer:'DEFERRED'}[c.type];a.ownerId=ownerId;a.decidedAt=now;this.put(w,'approval',a.id,a);follow=c.type==='approve';result={status:'ACCEPTED',approvalId:a.id};}}
   if(c.type==='retry'){const i=this.get(w,'incident',c.incidentId);result=i&&!terminal.has(i.status)?{status:'ACCEPTED'}:{status:'ACTION_DENIED',reason:'INCIDENT_NOT_ELIGIBLE'};follow=result.status==='ACCEPTED';}
   if(c.type==='lease_begin'){const old=this.get(w,'lease','production');if(c.expectedRevision!==this.revision||!Array.isArray(c.scope)||!c.scope.length||c.scope.some(s=>!key(s))||!Number.isInteger(c.ttlMs)||c.ttlMs<1000||c.ttlMs>3600000)result={status:'ACTION_DENIED',reason:'LEASE_PRECONDITION'};else if(this.list(w,'recovery').some(r=>['RUNNING','UNKNOWN'].includes(r.status)))result={status:'ACTION_DENIED',reason:'RECOVERY_CONFLICT_OR_RECONCILIATION_REQUIRED'};else if(old?.status==='ACTIVE')result={status:'ACTION_DENIED',reason:'LEASE_CONFLICT_OR_RECONCILIATION_REQUIRED'};else{const lease={id:'lease_'+randomUUID(),ownerId,revision:this.revision,scope:c.scope,fence:(old?.fence??0)+1,status:'ACTIVE',createdAt:now,heartbeatAt:now,expiresAt:now+c.ttlMs};this.put(w,'lease','production',lease);result={status:'ACCEPTED',lease};}}
   if(c.type==='lease_finish'&&!reconcile){const l=this.get(w,'lease','production');if(!l||l.id!==c.leaseId||l.fence!==c.fence||l.ownerId!==ownerId||l.status!=='ACTIVE'||l.expiresAt<=now)result={status:'ACTION_DENIED',reason:'LEASE_FENCE_OR_EXPIRY'};else{l.status='FINISHED';l.finishedAt=now;this.put(w,'lease','production',l);result={status:'ACCEPTED',lease:l};follow=true;}}
   if(reconcile){const l=this.get(w,'lease','production');if(!l||l.id!==c.leaseId||l.fence!==c.fence||l.status!=='ACTIVE'||l.ownerId!==ownerId||l.expiresAt>now||!deploymentEvidence||deploymentEvidence.workspace!==w||deploymentEvidence.ownerId!==ownerId||deploymentEvidence.leaseId!==l.id||deploymentEvidence.fence!==l.fence||deploymentEvidence.revision!==this.revision||deploymentEvidence.noActiveChanges!==true||!Number.isSafeInteger(deploymentEvidence.verifiedAt)||deploymentEvidence.verifiedAt>now||now-deploymentEvidence.verifiedAt>30000||!deploymentEvidence.evidenceId)result={status:'ACTION_DENIED',reason:'EXTERNAL_DEPLOYMENT_UNVERIFIED',verificationFailure};else{l.status='RECONCILED';l.fence++;l.reconciledAt=now;l.evidence=deploymentEvidence;this.put(w,'lease','production',l);result={status:'ACCEPTED',lease:l};follow=true;}}
   if(c.type==='revoke_approval'){const a=this.get(w,'approval',c.approvalId);if(!a||a.consumed)result={status:'ACTION_DENIED',reason:'APPROVAL_ABSENT_OR_CONSUMED'};else{a.decision='REVOKED';a.ownerId=ownerId;a.decidedAt=now;this.put(w,'approval',a.id,a);result={status:'ACCEPTED'};}}
   if(c.type==='checkpoint'){if(key(c.missionId)&&['IN_PROGRESS','BLOCKED','ACCEPTANCE_PENDING'].includes(c.state)&&Array.isArray(c.evidence)){const checkpoint={id:c.missionId,state:c.state,evidence:safe(c.evidence),at:now,revision:this.revision,ownerId};this.put(w,'checkpoint',c.missionId,checkpoint);result={status:'ACCEPTED',checkpoint};}else result={status:'ACTION_DENIED',reason:'CHECKPOINT_REQUIRES_VERIFIED_CLOSURE'};}
   const r={id:c.id,digest,type:c.type,ownerId,at:now,revision:this.revision,...result};this.put(w,'command',c.id,r);this.event(w,'OWNER_COMMAND',r);return r;
  });
  if(follow)await this.tick(w);return receipt;
 }
}
/** Called only by the independently supervised inspector; never renews primary monitoring. */
export function inspectControlPlaneMonitor(control,workspace='ws_empire_1'){
 const state=control.snapshot(workspace);
 const incident=control.observe(workspace,{id:'assurance-primary-monitor',capability:'assurance-monitor',status:state.monitor.fresh?'HEALTHY':'STALE',severity:'CRITICAL',classification:'MONITORING_COVERAGE_LOST',summary:state.monitor.fresh?'Primary Assurance monitor is current':'Primary Assurance monitor heartbeat is missing or stale',evidence:{heartbeat:state.monitor.heartbeat}});
 control.heartbeat(workspace,'watchdog');return {fresh:state.monitor.fresh,incident};
}
