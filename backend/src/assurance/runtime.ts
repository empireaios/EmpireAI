import {acceptanceRevisionEligible,retainedAcceptance} from './acceptance-continuity.js';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {z} from 'zod';
import type {FastifyInstance} from 'fastify';
import {checkToolContract} from './functional-probes.js';
import {AdvisorStore} from '../advisor/store.js';
import {AdvisorTaskGateway} from './advisor-agent.js';
import {readLockedPricingPolicy} from '../brain/llm/locked-inference.js';
import {capabilities} from '../intelligence/model.js';
import {configuredLockedProviders} from '../brain/llm/locked-provider-orchestration.js';
import {verifyReconciliation,rebuildReconciliation,readReconciliation,reconciliationHash,readReconciliationSources} from './evidence-reconciliation.js';
const workspace='ws_empire_1';
const key=z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/);
const base={id:key};
export const assuranceCommandSchema=z.discriminatedUnion('type',[
 z.object({...base,type:z.enum(['health_check','pause','resume','record_handover']),reason:z.string().max(500).optional()}).strict(),
 z.object({...base,type:z.enum(['approve','reject','defer','revoke_approval']),approvalId:key}).strict(),
 z.object({...base,type:z.literal('retry'),incidentId:key}).strict(),
 z.object({...base,type:z.literal('lease_begin'),expectedRevision:key,scope:z.array(key).min(1).max(10),ttlMs:z.number().int().min(1000).max(3600000)}).strict(),
 z.object({...base,type:z.enum(['lease_finish','lease_reconcile']),leaseId:key,fence:z.number().int().positive()}).strict(),
 z.object({...base,type:z.literal('checkpoint'),missionId:key,state:z.enum(['IN_PROGRESS','BLOCKED','ACCEPTANCE_PENDING']),evidence:z.array(z.string().max(500)).max(50)}).strict(),
 z.object({...base,type:z.literal('mission_close'),missionId:key,state:z.enum(['COMPLETE','INCOMPLETE','BLOCKED_EXTERNAL','OWNER_ACTION_REQUIRED']),externalEvidence:z.object({backendSha:z.string().regex(/^[a-f0-9]{40}$/),frontendSha:z.string().regex(/^[a-f0-9]{40}$/),backendDeploymentId:key,frontendDeploymentId:key,ciRunIds:z.array(key).min(2).max(10),preservationDigest:z.string().regex(/^[a-f0-9]{64}$/),readbackProof:z.string().min(10).max(2000),desktopProof:z.string().min(10).max(2000),mobileProof:z.string().min(10).max(2000),collisionProof:z.string().min(10).max(2000),selfFailureProof:z.string().min(10).max(2000)}).strict()}).strict(),
 z.object({...base,type:z.literal('acceptance_admit'),mode:z.enum(['AUTOMATIC','API_ADVISOR','OWNER_APPROVAL','MONITOR_FAILURE','DEPLOYMENT_COLLISION']),expectedRevision:key,expectedSha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
]);
type PreservationManifest={schema:'source-preservation-v1';scope:'RECONCILIATION_SOURCE_RECORDS';maxRecords:300;coverage:'COMPLETE_WITHIN_BOUNDED_SOURCE_READ';records:{kind:string;id:string;sha256:string}[]};
/** Exact existing records must remain; independently collected additive records are allowed. */
export function sourcePreservationManifest(root:string):PreservationManifest {
 const source=readReconciliationSources(root,workspace),records:PreservationManifest['records']=[];
 const add=(kind:string,id:unknown,value:unknown)=>{if(typeof id!=='string'||!id||id.length>200||records.some(r=>r.kind===kind&&r.id===id))throw Error('PRESERVATION_IDENTITY_UNKNOWN');records.push({kind,id,sha256:reconciliationHash(value)});};
 for(const m of source.missions)add('mission',m.id,m);
 for(const r of source.requests)add('request',r.requestId,r);
 for(const m of source.memory)add('memory',m.id,m);
 for(const e of source.evidence)add('evidence',e.id,e);
 for(const receipts of Object.values(source.accounting))for(const r of receipts)add('accounting',r.requestKey,r);
 if(source.missions.length>=100||source.requests.length>=10000||source.memory.length>=10000||source.evidence.length>=10000||records.length>300||JSON.stringify(records).length>48000)throw Error('PRESERVATION_COVERAGE_BOUND');
 return {schema:'source-preservation-v1',scope:'RECONCILIATION_SOURCE_RECORDS',maxRecords:300,coverage:'COMPLETE_WITHIN_BOUNDED_SOURCE_READ',records};
}
export function verifySourcePreservation(root:string,manifest:PreservationManifest|undefined){
 try{if(!manifest||manifest.schema!=='source-preservation-v1'||manifest.coverage!=='COMPLETE_WITHIN_BOUNDED_SOURCE_READ')return {verified:false,status:'MANIFEST_UNAVAILABLE'};const current=sourcePreservationManifest(root),missing=manifest.records.filter(r=>!current.records.some(c=>c.kind===r.kind&&c.id===r.id&&c.sha256===r.sha256));return {verified:missing.length===0,status:missing.length?'SOURCE_CHANGED_OR_MISSING':'ORIGINAL_RECORDS_PRESERVED',originalCount:manifest.records.length,currentCount:current.records.length,addedCount:current.records.length-manifest.records.length,manifestSha256:reconciliationHash(manifest),mismatches:missing.map(r=>({kind:r.kind,id:r.id}))};}catch{return {verified:false,status:'PRESERVATION_UNAVAILABLE_OR_BOUND'};}
}
type Control=any;
let active:AssuranceRuntime|null=null;
export class AssuranceRuntime {
 private busy=false;
 advisorWork:Promise<unknown>|null=null;
 readonly advisor:AdvisorTaskGateway;
 constructor(readonly root:string,readonly revision:string,readonly control:Control){
  this.advisor=new AdvisorTaskGateway(new AdvisorStore(path.join(root,'commissioning','communications.sqlite')),{
   readEvidence:async task=>({refs:task.evidenceRefs,data:{incident:control.get(workspace,'incident',task.incidentId),reconciliation:verifyReconciliation(root,workspace),authority:{birth:'NOT_BORN',commerce:'LOCKED'},allowedAction:'Rebuild only the derived reconciliation view from immutable sources'}}),
   eligible:async task=>task.expectedRevision===revision&&!control.snapshot(workspace).paused.paused&&control.snapshot(workspace).lease?.status!=='ACTIVE'&&control.get(workspace,'incident',task.incidentId)?.runbookId==='rebuild_reconciliation_advisor',
   execute:async(task,_action,runbook)=>{if(runbook!=='rebuild_reconciliation_advisor'||control.get(workspace,'incident',task.incidentId)?.runbookId!==runbook)throw Error('RUNBOOK_SCOPE');return control.recover(workspace,task.incidentId,{actor:'API_ADVISOR'});},
   reconcileAction:async(task)=>control.snapshot(workspace).recoveries.find((r:any)=>r.incidentId===task.incidentId&&r.actor==='API_ADVISOR')??null,
   verify:async(_task,receipt:any)=>({verified:receipt?.status==='VERIFIED'&&verifyReconciliation(root,workspace).healthy,evidence:{receipt,reconciliation:verifyReconciliation(root,workspace)}}),
  });
 }
 snapshot(){let reconciliation;try{reconciliation={...readReconciliation(this.root,workspace),derivedSha256:verifyReconciliation(this.root,workspace).sha256??null};}catch{reconciliation={status:'UNAVAILABLE',reason:'Required durable source unavailable'};}return {controlPlane:{...this.control.snapshot(workspace),acceptances:this.control.list(workspace,'acceptance_history').map(({sourceManifest,...record}:any)=>({...record,preservationManifestSha256:sourceManifest?reconciliationHash(sourceManifest):null,preservationOriginalCount:sourceManifest?.records?.length??null})),activeAcceptance:this.control.get(workspace,'acceptance','active')?.completed===false?this.control.get(workspace,'acceptance','active').id:null},advisor:this.advisor.summary(workspace),reconciliation,authority:{birth:'NOT_BORN',commerce:'LOCKED'}};}
 async cycle(){
  if(this.busy||this.control.get(workspace,'acceptance','active')?.pauseUntil>Date.now())return;this.busy=true;
  try{
   const observe=(id:string,status:string,summary:string,evidence:unknown={},runbookId?:string)=>this.control.observe(workspace,{id,capability:id,status,summary,evidence,classification:id,runbookId});
   const contract=checkToolContract();observe('model_server_contract',contract.status,contract.summary,contract.evidence);
   observe('durable_control', 'HEALTHY','Operational event store is readable',{events:this.control.snapshot(workspace).events.length});
   const configured=configuredLockedProviders();const pricing=readLockedPricingPolicy().map(p=>({...p,active:configured.includes(p.provider as any)}));observe('pricing_review',pricing.some(p=>p.active&&p.status==='EXPIRED')?'BLOCKED':pricing.some(p=>p.active&&p.status==='EXPIRING')?'DEGRADED':'HEALTHY','Local inference price review expiry',pricing);
   const providers=configuredLockedProviders();observe('provider_configuration',providers.length?'UNVERIFIED':'UNAVAILABLE','Configured credentials are not a functional provider-call verification',{configured:providers,inferenceCalls:0});
   try{const h=JSON.parse(fs.readFileSync(path.join(this.root,'commissioning','assurance.sqlite.watchdog'),'utf8'));const fresh=Number.isSafeInteger(h.observedAt)&&h.observedAt<=Date.now()&&Date.now()-h.observedAt<90000;observe('independent_inspector',fresh?'HEALTHY':'STALE','External inspector heartbeat',{observedAt:h.observedAt});}catch{observe('independent_inspector','UNAVAILABLE','External inspector heartbeat unavailable');}
   try {
    const filename=path.join(this.root,'commissioning','intelligence.sqlite');
    if(fs.realpathSync(filename)!==filename)throw Error('SOURCE_PATH');
    const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:100});
    try {db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');
     const row=db.prepare("SELECT body FROM objects WHERE workspace=? AND kind='scheduler' AND id='health'").get(workspace);
     const h=row?JSON.parse(String(row.body)):null;const fresh=h?.heartbeatAt&&Date.parse(h.heartbeatAt)<=Date.now()&&Date.now()-Date.parse(h.heartbeatAt)<120000;
     observe('four_eyes_scheduler',fresh&&h.status==='RUNNING'?'HEALTHY':fresh?'DEGRADED':'STALE','Durable Four Eyes scheduler progress',{heartbeatAt:h?.heartbeatAt??null,status:h?.status??'MISSING'});
     const health=db.prepare("SELECT id,body FROM objects WHERE workspace=? AND kind='health' LIMIT 40").all(workspace).map(r=>({id:r.id,...JSON.parse(String(r.body))}));
     const reads=capabilities.filter(c=>c.implemented).map(c=>{const h=health.find(h=>h.id===c.id);const at=Date.parse(h?.lastGoodAt??'');return {id:c.id,status:h?.failure?'DEGRADED':!Number.isFinite(at)?'UNVERIFIED':at>Date.now()||Date.now()-at>c.ttlMs?'STALE':'HEALTHY',lastGoodAt:h?.lastGoodAt??null,failure:h?.failure??null};});
     observe('four_eyes_reads',reads.every(h=>h.status==='HEALTHY')?'HEALTHY':reads.some(h=>h.status==='DEGRADED')?'DEGRADED':'UNVERIFIED','Per-capability saved reads with freshness; no monitoring API calls',reads);
    } finally {db.close();}
   } catch {observe('four_eyes_scheduler','UNAVAILABLE','Four Eyes durable scheduler source unavailable');}
   try {const r=readReconciliation(this.root,workspace);observe('response_evidence_linkage',r.conflicts.length?'DEGRADED':r.investigations.length?'HEALTHY':'UNVERIFIED','Cross-source request/assessment/evidence binding',{conflicts:r.conflicts.map((v:any)=>({id:v.id,code:v.code,missionId:v.missionId}))});}catch{observe('response_evidence_linkage','UNAVAILABLE','Required response/evidence source unavailable');}
   const view=verifyReconciliation(this.root,workspace);
   const admission=this.control.get(workspace,'acceptance','active');
   const advisorMode=admission?.mode==='API_ADVISOR'&&!admission.completed;
   const incident=observe('reconciliation_view',view.healthy?'HEALTHY':'DEGRADED','Derived operational evidence reconciliation',{status:view.status,sha256:view.sha256??null},advisorMode?'rebuild_reconciliation_advisor':'rebuild_reconciliation');
   if(admission&&!admission.completed&&!['OWNER_APPROVAL','MONITOR_FAILURE'].includes(admission.mode)&&!view.healthy&&incident.id?.startsWith('inc_')&&!admission.incidentId){admission.incidentId=incident.id;this.control.put(workspace,'acceptance','active',admission);this.control.put(workspace,'acceptance_history',admission.id,admission);}
   if(advisorMode&&!view.healthy&&incident.id?.startsWith('inc_')&&!this.advisor.list(workspace).some(t=>t.incident===incident.id)){
    this.advisor.admit({actor:'ASSURANCE',workspace,authenticated:true},{id:'advisor_'+incident.id,workspace,incidentId:incident.id,expectedRevision:this.revision,objective:'Independently inspect the missing derived reconciliation view. Rebuild it using the sole allowlisted runbook if evidence supports safe repair. Preserve every source record.',evidenceRefs:[incident.id,admission.id],allowedRunbooks:['rebuild_reconciliation_advisor'],expiresAt:new Date(Date.now()+3600000).toISOString(),priority:'HIGH',maxOutputTokens:4096,synthetic:false});
   }
   await this.control.tick(workspace);
   for(const task of this.advisor.list(workspace))if(task.status==='WAITING_FOR_DEPENDENCY'&&task.stage!=='NOT_STARTED')await this.advisor.reconcile(workspace,String(task.id));
   await this.advisor.resumeEligible(workspace);
   if(!this.advisorWork)this.advisorWork=this.advisor.runNext(workspace).catch(()=>null).finally(()=>{this.advisorWork=null;});
   if(admission?.mode==='MONITOR_FAILURE'&&!admission.completed){
    const monitorIncident=this.control.snapshot(workspace).incidents.find((i:any)=>i.probeId==='assurance-primary-monitor'&&i.lastAt>=admission.at&&i.verifiedAt>=admission.pauseUntil&&i.status==='RECOVERED');
    if(monitorIncident&&verifySourcePreservation(this.root,admission.sourceManifest).verified){const completed={...admission,completed:true,preservation:verifySourcePreservation(this.root,admission.sourceManifest),monitorIncidentId:monitorIncident.id,verifiedAt:Date.now()};this.control.put(workspace,'acceptance','active',completed);this.control.put(workspace,'acceptance_history',admission.id,completed);this.control.event(workspace,'MONITOR_RECOVERY_VERIFIED',{id:admission.id,monitorIncidentId:monitorIncident.id,independentInspector:true});}
   }
   const acceptanceRepair=admission&&this.control.snapshot(workspace).recoveries.find((r:any)=>r.status==='VERIFIED'&&r.startedAt>=admission.at&&r.incidentId===admission.incidentId&&r.runbookId===(admission.mode==='OWNER_APPROVAL'?'quarantine_reconciliation':admission.mode==='API_ADVISOR'?'rebuild_reconciliation_advisor':'rebuild_reconciliation'));
   if(admission&&!admission.completed&&admission.mode!=='MONITOR_FAILURE'&&acceptanceRepair&&(admission.mode!=='DEPLOYMENT_COLLISION'||this.control.list(workspace,'incident').some((i:any)=>i.id===admission.incidentId&&i.deploymentDeferredAt))&&(admission.mode!=='OWNER_APPROVAL'||acceptanceRepair.ownerApprovalActor)&&(admission.mode!=='API_ADVISOR'||this.advisor.list(workspace).some(t=>t.incident===admission.incidentId&&t.status==='COMPLETED'))&&verifySourcePreservation(this.root,admission.sourceManifest).verified&&verifyReconciliation(this.root,workspace).healthy){const completed={...admission,completed:true,preservation:verifySourcePreservation(this.root,admission.sourceManifest),recoveryId:acceptanceRepair.id,verifiedAt:Date.now()};this.control.put(workspace,'acceptance','active',completed);this.control.put(workspace,'acceptance_history',admission.id,completed);this.control.event(workspace,'ACCEPTANCE_POSTSTATE_VERIFIED',{id:admission.id,mode:admission.mode,recoveryId:acceptanceRepair.id,sourceDigest:reconciliationHash(readReconciliationSources(this.root,workspace))});}
  }finally{this.busy=false;}
 }
 async command(ownerId:string,input:unknown){
  const c=assuranceCommandSchema.parse(input);
  if(c.type==='mission_close')return this.closeMission(ownerId,c);
  if(c.type==='record_handover'){
   const id='work1-compounded-ceo-intelligence',text=fs.readFileSync(new URL('../../../docs/work1/compounded-ceo-intelligence-owner-mandate.md',import.meta.url),'utf8');
   const sha256=reconciliationHash(text),prior=this.control.get(workspace,'handover',id);
   if(prior&&prior.sha256!==sha256)throw Error('HANDOVER_IMMUTABILITY_CONFLICT');
   const inputHash=reconciliationHash({ownerId,c}),previous=this.control.get(workspace,'command',c.id);
   if(previous){if(previous.inputHash!==inputHash)throw Error('COMMAND_REPLAY_CONFLICT');return previous;}
   const handover=prior??{id,state:'HANDOVER_ONLY_NOT_STARTED',ownerId,at:Date.now(),revision:this.revision,sha256,text,links:['Work 1 independent audit','Work 8 unseen certification'],grantsExecutionAuthority:false};
   const receipt={id:c.id,type:c.type,inputHash,ownerId,at:Date.now(),revision:this.revision,status:'ACCEPTED',handoverId:id,sha256};
   return this.control.tx(()=>{if(!prior){this.control.put(workspace,'handover',id,handover);this.control.event(workspace,'OWNER_STRATEGIC_HANDOVER_RECORDED',handover);}this.control.put(workspace,'command',c.id,receipt);return receipt;});
  }
  if(c.type!=='acceptance_admit'){const result=await this.control.command(workspace,ownerId,c);if(c.type==='health_check')await this.cycle();return result;}
  const prior=this.control.get(workspace,'command',c.id);if(prior){if(prior.inputHash!==reconciliationHash({ownerId,c}))throw Error('COMMAND_REPLAY_CONFLICT');return prior;}
  const v=verifyReconciliation(this.root,workspace);const snapshot=this.control.snapshot(workspace);
  if(c.expectedRevision!==this.revision||!v.healthy||v.sha256!==c.expectedSha256||snapshot.lease?.status==='ACTIVE'||this.busy||this.control.get(workspace,'acceptance','active')?.completed===false)throw Error('ACCEPTANCE_PRECONDITION');
  const sourceManifest=sourcePreservationManifest(this.root);
  let deploymentLease:any=null;
  if(c.mode==='DEPLOYMENT_COLLISION'){const leaseReceipt=await this.control.command(workspace,ownerId,{id:c.id.slice(0,140)+'_lease',type:'lease_begin',expectedRevision:this.revision,scope:['controlled_acceptance_work_release'],ttlMs:300000});if(leaseReceipt.status!=='ACCEPTED')throw Error('DEPLOYMENT_ACCEPTANCE_LEASE_DENIED');deploymentLease=leaseReceipt.lease;}
  const record={id:c.id,type:c.type,ownerId,mode:c.mode,revision:this.revision,at:Date.now(),inputHash:reconciliationHash({ownerId,c}),sourceDigest:reconciliationHash(readReconciliationSources(this.root,workspace)),sourceManifest,derivedSha256:v.sha256,status:'ACCEPTED',completed:false,...(deploymentLease?{lease:deploymentLease,simulation:'CONTROLLED_WORK_LEASE_NO_PLATFORM_ROLLOUT'}:{}),...(c.mode==='MONITOR_FAILURE'?{pauseUntil:Date.now()+120000}:{})};
  this.control.tx(()=>{this.control.put(workspace,'command',c.id,record);this.control.put(workspace,'acceptance','active',record);this.control.put(workspace,'acceptance_history',record.id,record);this.control.event(workspace,'OWNER_BOUNDED_ACCEPTANCE_ADMITTED',record);});
  if(c.mode==='MONITOR_FAILURE'){this.control.event(workspace,'MONITOR_PAUSE_ADMITTED',{id:c.id,pauseUntil:record.pauseUntil,automaticResume:true,scope:'PRIMARY_ASSURANCE_TIMER_ONLY'});return record;}
  if(c.mode==='OWNER_APPROVAL'){
   const incident=this.control.observe(workspace,{id:'approval_quarantine',capability:'approval_quarantine',status:'DEGRADED',summary:'Owner-requested reversible quarantine of the derived operational view awaits explicit approval',classification:'BOUNDED_OWNER_ACCEPTANCE',runbookId:'quarantine_reconciliation'});
   const bound={...record,incidentId:incident.id};this.control.put(workspace,'acceptance','active',bound);this.control.put(workspace,'acceptance_history',record.id,bound);
   await this.control.tick(workspace);
  }else{
   const file=path.join(this.root,'commissioning','reconciliation-'+workspace+'.json');
   fs.renameSync(file,file+'.acceptance-'+c.id);this.control.event(workspace,'DERIVED_VIEW_QUARANTINED',{id:c.id,sourceDigest:record.sourceDigest,sourceRecordsChanged:false});
  }
  return record;
 }
 private closeMission(ownerId:string,c:Extract<z.infer<typeof assuranceCommandSchema>,{type:'mission_close'}>){
  const prior=this.control.get(workspace,'command',c.id),inputHash=reconciliationHash({ownerId,c});if(prior){if(prior.inputHash!==inputHash)throw Error('COMMAND_REPLAY_CONFLICT');return prior;}
  const snapshot=this.control.snapshot(workspace),history=this.control.list(workspace,'acceptance_history');
  const accepted=['AUTOMATIC','API_ADVISOR','OWNER_APPROVAL','DEPLOYMENT_COLLISION'].map(mode=>history.find((h:any)=>h.mode===mode&&h.completed&&h.preservation?.verified===true&&verifySourcePreservation(this.root,h.sourceManifest).verified&&acceptanceRevisionEligible(h,this.revision)&&snapshot.recoveries.some((r:any)=>r.id===h.recoveryId&&r.incidentId===h.incidentId&&r.status==='VERIFIED'&&(mode!=='OWNER_APPROVAL'||r.ownerApprovalActor)&&(mode!=='API_ADVISOR'||r.actor==='API_ADVISOR'))));
  const advisor=accepted[1]&&this.advisor.list(workspace).find(t=>t.incident===accepted[1].incidentId&&t.status==='COMPLETED'&&JSON.parse(String(t.result??'{}')).decision?.action==='RUNBOOK');
  const monitorAccepted=history.find((h:any)=>h.mode==='MONITOR_FAILURE'&&h.completed&&h.preservation?.verified===true&&verifySourcePreservation(this.root,h.sourceManifest).verified&&acceptanceRevisionEligible(h,this.revision)&&snapshot.incidents.some((i:any)=>i.id===h.monitorIncidentId&&i.status==='RECOVERED'&&i.verifiedAt>=h.pauseUntil));
  const blockers=[];if(!this.control.get(workspace,'handover','work1-compounded-ceo-intelligence'))blockers.push('WORK1_HANDOVER_NOT_RECORDED');if(!monitorAccepted)blockers.push('INDEPENDENT_MONITOR_RESTORATION_UNVERIFIED');if(accepted.some(a=>!a))blockers.push('ACCEPTANCE_CHAIN_INCOMPLETE');if(!advisor)blockers.push('INDEPENDENT_ADVISOR_ACTION_UNVERIFIED');if(snapshot.recoveries.some((r:any)=>['UNKNOWN','RUNNING'].includes(r.status)))blockers.push('EFFECT_RECONCILIATION_REQUIRED');if(!verifyReconciliation(this.root,workspace).healthy)blockers.push('DERIVED_VIEW_UNVERIFIED');if(c.externalEvidence.backendSha!==this.revision)blockers.push('REVISION_MISMATCH');if(process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1')blockers.push('AUTHORITY_PROFILE_UNVERIFIED');
  if(c.state==='COMPLETE'&&blockers.length)throw Error('CLOSURE_DENIED:'+blockers.join(','));
  const checkpoint={id:c.missionId,state:c.state,revision:this.revision,ownerId,at:Date.now(),acceptanceIds:[...accepted,monitorAccepted].filter(Boolean).map(a=>a.id),advisorTaskId:advisor?.id??null,retainedAcceptance,acceptanceRevisions:[...accepted,monitorAccepted].filter(Boolean).map(a=>({id:a.id,revision:a.revision})),handoverId:'work1-compounded-ceo-intelligence',blockers,externalEvidence:{...c.externalEvidence,verification:'AUTHENTICATED_OWNER_ATTESTATION_NOT_SERVER_PLATFORM_VERIFICATION'},authority:{birth:'NOT_BORN',commerce:'LOCKED'}};
  const receipt={id:c.id,type:c.type,inputHash,ownerId,at:Date.now(),revision:this.revision,status:'ACCEPTED',checkpoint};
  return this.control.tx(()=>{this.control.put(workspace,'checkpoint',c.missionId,checkpoint);this.control.put(workspace,'command',c.id,receipt);this.control.event(workspace,'MISSION_CLOSURE_RECORDED',checkpoint);return receipt;});
 }

}
export async function createAssuranceRuntime(root:string,revision:string){
 const moduleUrl=new URL('../../src/assurance/control-plane.mjs',import.meta.url).href;
 const {AssuranceControlPlane}=await import(moduleUrl);
 const rebuild={version:'1',authority:'A',capability:'reconciliation_view',timeoutMs:10000,maxAttempts:2,cooldownMs:30000,
 execute:async()=>rebuildReconciliation(root,workspace,revision),verify:async()=>verifyReconciliation(root,workspace),reconcile:async()=>({completed:verifyReconciliation(root,workspace).healthy})};
 const control=new AssuranceControlPlane({root:path.join(root,'commissioning'),revision,runbooks:{
  rebuild_reconciliation:rebuild,rebuild_reconciliation_advisor:{...rebuild,executor:'API_ADVISOR'},
  quarantine_reconciliation:{...rebuild,authority:'B',capability:'approval_quarantine',title:'Quarantine and rebuild the derived operational view',description:'Move only the derived reconciliation JSON to a retained quarantine copy, rebuild it from existing sources, and verify unchanged source digest.',approvalReason:'A deliberate operational view interruption requires your specific approval.',execute:async()=>{const before=reconciliationHash(readReconciliationSources(root,workspace));const file=path.join(root,'commissioning','reconciliation-'+workspace+'.json');if(fs.existsSync(file))fs.renameSync(file,file+'.approved-'+Date.now());const result=rebuildReconciliation(root,workspace,revision);return {...result,sourceUnchanged:before===reconciliationHash(readReconciliationSources(root,workspace))};},verify:async({result}:any)=>({healthy:result?.sourceUnchanged===true&&verifyReconciliation(root,workspace).healthy})}
 }});
 return new AssuranceRuntime(root,revision,control);
}
/** Readback never initializes a runtime or executes monitoring/recovery/inference. */
export async function readAdvancedAssurance(w:string){if(w!==workspace)throw Error('WORKSPACE_REQUIRED');return active?.snapshot()??{status:'NOT_INSTALLED',controlPlane:null,advisor:null,reconciliation:null};}
export async function readAssuranceRecord(w:string,kind:string,id:string){if(w!==workspace||!active)throw Error('WORKSPACE_OR_RUNTIME_UNAVAILABLE');if(kind==='event'){if(!/^\d+$/.test(id))throw Error('EVENT_ID');const r=active.control.db.prepare('SELECT seq,at,type,body FROM cp_events WHERE workspace=? AND seq=?').get(w,Number(id));return r?{...r,body:JSON.parse(r.body)}:null;}if(!['incident','recovery','approval','command','checkpoint','acceptance_history','probe','handover'].includes(kind))throw Error('RECORD_KIND_UNAVAILABLE');return active.control.get(w,kind,id);}
export async function assuranceOwnerCommand(ownerId:string,input:unknown){if(!active)throw Error('ASSURANCE_RUNTIME_UNAVAILABLE');return active.command(ownerId,input);}
export function installAssuranceRuntime(app:FastifyInstance){
 let timer:ReturnType<typeof setInterval>|undefined;
 app.addHook('onReady',async()=>{if(process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1')return;const root=process.env.RAILWAY_VOLUME_MOUNT_PATH,revision=process.env.RAILWAY_GIT_COMMIT_SHA;if(!root||!revision)return;active=await createAssuranceRuntime(root,revision);active.advisor.recoverInterrupted(workspace);const run=()=>active?.cycle().catch(()=>{ /* stale persisted heartbeat exposes failed monitoring */ });void run();timer=setInterval(run,30000);timer.unref();});
 app.addHook('onClose',async()=>{if(timer)clearInterval(timer);if(active?.advisorWork)await active.advisorWork;active?.control.close();active=null;});
}
