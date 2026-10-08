import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

type Row=Record<string,any>;
export const reconciliationHash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const safeKey=(s:string)=>{if(!/^[A-Za-z0-9_.:-]{1,160}$/.test(s))throw Error('RECONCILIATION_SCOPE');return s;};
function rows(root:string,file:string,sql:string,w:string):Row[]{
 const f=path.join(root,'commissioning',file);if(!fs.existsSync(f))return [];
 if(fs.realpathSync(f)!==f||!fs.lstatSync(f).isFile())throw Error('RECONCILIATION_SOURCE_PATH');
 const db=new DatabaseSync(f,{readOnly:true,allowExtension:false,timeout:1000});
 try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');return db.prepare(sql).all(w).map(r=>JSON.parse(String(r.body)));}finally{db.close();}
}
export type ReconciliationSources={missions:Row[];requests:Row[];memory:Row[];evidence:Row[];accounting:Record<string,Row[]>};
/** Exact consultation keys come only from the workspace-scoped durable mission, never caller input. */
export function readMissionAccounting(root:string,workspace:string,mission:Row):Row[]{
 const requestId=mission.requestId;if(typeof requestId!=='string')return [];
 const hashKey=(suffix:string)=>createHash('sha256').update(workspace+'\0'+requestId+suffix).digest('hex');
 const keys=new Set<string>([hashKey(''),hashKey(':readonly-result')]);
 if(mission.assessment?.requestId===requestId){
  const provenance=mission.assessment.provenance;
  for(const p of [provenance,...(provenance?.consultations??[])])if(typeof p?.requestKey==='string'&&/^[a-f0-9]{64}$/.test(p.requestKey))keys.add(p.requestKey);
 }
 if(keys.size>32)throw Error('ACCOUNTING_CORRELATION_BOUND');
 const f=path.join(root,'commissioning','openai-october-2026.sqlite');if(!fs.existsSync(f))return [];
 if(fs.realpathSync(f)!==f||!fs.lstatSync(f).isFile()||!fs.existsSync(f+'.initialized'))throw Error('ACCOUNTING_SOURCE_PATH');
 const db=new DatabaseSync(f,{readOnly:true,allowExtension:false,timeout:1000});
 try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  if(db.prepare('PRAGMA application_id').get()?.application_id!==1162430793||db.prepare('PRAGMA user_version').get()?.user_version!==1)throw Error('ACCOUNTING_SOURCE_SCHEMA');
  const result:Row[]=[];
  for(const requestKey of [...keys].sort()){
   const raw=db.prepare('SELECT c.id,c.timestamp,c.model,c.status,c.reserved_micro_usd,c.estimated_micro_usd,c.invoice_actual_micro_usd,c.usage_json,p.provider FROM calls c JOIN call_providers p ON p.call_id=c.id WHERE p.request_key=? ORDER BY c.timestamp,c.id LIMIT 33').all(requestKey);
   if(raw.length>32)throw Error('ACCOUNTING_CORRELATION_BOUND');
   if(!raw.length)continue;
   const records=raw.map(r=>{for(const k of ['reserved_micro_usd','estimated_micro_usd','invoice_actual_micro_usd'])if(r[k]!==null&&(!Number.isSafeInteger(r[k])||Number(r[k])<0))throw Error('ACCOUNTING_QUANTITY');return {id:r.id,timestamp:r.timestamp,provider:r.provider,model:r.model,status:r.status,reservedMicroUsd:r.reserved_micro_usd,estimatedMicroUsd:r.estimated_micro_usd,invoiceActualMicroUsd:r.invoice_actual_micro_usd,usage:r.usage_json?JSON.parse(String(r.usage_json)):null};});
   result.push({requestKey,requestId,workspace,correlation:'EXACT_DURABLE_MISSION_PROVENANCE_OR_SCOPED_REQUEST_HASH',records,readOnly:true,inferenceCalls:0});
  }
  return result;
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}
/** Fixed local, workspace-qualified reads. No provider call, request dispatch, or source mutation. */
export function readReconciliationSources(root:string,workspace:string):ReconciliationSources{
 safeKey(workspace);for(const name of ['intelligence.sqlite','pillow-request-receipts.sqlite','pillow-institutional.sqlite'])if(!fs.existsSync(path.join(root,'commissioning',name)))throw Error('RECONCILIATION_REQUIRED_SOURCE_UNAVAILABLE');const missions=rows(root,'intelligence.sqlite',"SELECT body FROM objects WHERE workspace=? AND kind='investigations' ORDER BY id LIMIT 100",workspace);
 const accounting:Record<string,Row[]>={};
 for(const m of missions)if(m.requestId){try{accounting[m.requestId]=readMissionAccounting(root,workspace,m);}catch{accounting[m.requestId]=[];}}
 return {missions,requests:rows(root,'pillow-request-receipts.sqlite','SELECT body FROM receipts WHERE workspace=? ORDER BY request LIMIT 10000',workspace),memory:rows(root,'pillow-institutional.sqlite',"SELECT body FROM records WHERE workspace=? AND kind='EXPERIENCE' ORDER BY id LIMIT 10000",workspace),evidence:rows(root,'intelligence.sqlite',"SELECT body FROM objects WHERE workspace=? AND kind='evidence' ORDER BY id LIMIT 10000",workspace),accounting};
}
/** Time-qualified projection: later engineering acceptance never upgrades a commercial verdict. */
export function reconcileSources(workspace:string,s:ReconciliationSources){
 const sources:Row[]=[];const conflicts:Row[]=[];
 const add=(system:string,id:string,body:Row,at:string|null,authority:string)=>{const ref={system,id,sha256:reconciliationHash(body),observedAt:at,authority,revision:body.revision??body.backendSha??null};sources.push(ref);return ref;};
 const investigations=s.missions.map(m=>{
  const assessment=m.assessment;const mission=add('MISSION_LEDGER',m.id,m,m.closure?.at??m.startedAt??m.createdAt??null,'DURABLE_WORKFLOW_RECORD');
  const assessmentRef=assessment?add('PILLOW_ASSESSMENT',m.requestId,assessment,assessment.at??null,'MODEL_GENERATED_HISTORICAL_ASSESSMENT'):null;
  const request=s.requests.find(r=>r.requestId===m.requestId);const response=request?.finalResult?.message;
  const assessmentIntact=Boolean(assessment&&assessment.requestId===m.requestId&&reconciliationHash(assessment.answer??assessment.text??assessment.content??'')===assessment.sha256);
  // Existing assessment records use answer; this is checked independently from the stored request.
  const persisted=Boolean(request?.status==='COMPLETED'&&typeof response==='string'&&reconciliationHash(response)===assessment?.sha256&&assessmentIntact);
  if(request)add('PILLOW_REQUEST',request.requestId,request,request.updatedAt??null,'DURABLE_REQUEST_RECEIPT');
  const closure=m.closure;const accepted=m.status==='COMPLETE'&&persisted&&closure?.advisorReadback?.requestId===m.requestId&&closure?.advisorReadback?.assessmentHash===assessment?.sha256&&Number.isFinite(Date.parse(closure?.at))&&Date.parse(closure.at)>=Date.parse(assessment.at);
  const readback=accepted&&closure.advisorReadback.attestedBy==='AUTHENTICATED_OWNER';
  const evidence=(assessment?.evidenceIds??[]).map((id:string)=>{const e=s.evidence.find(v=>v.id===id);return e?add('FOUR_EYES',id,e,e.observedAt??e.retrievedAt??null,e.authenticity??'UNVERIFIED'):{id,status:'MISSING'};});
  const predecessorRecords=(m.predecessors??[]).map((id:string)=>{const r=s.requests.find(v=>v.requestId===id);return r?{requestId:id,status:r.status,failureClass:r.failureClass??null,source:add('PILLOW_PREDECESSOR',id,r,r.updatedAt??null,'DURABLE_REQUEST_RECEIPT')}:{requestId:id,status:'UNAVAILABLE'};});
  const memory=s.memory.filter(r=>r.request===m.requestId).map(r=>add('INSTITUTIONAL_MEMORY',r.id,r,r.recordedAt??null,r.origin?.authenticity??'UNVERIFIED'));
  const receipts=s.accounting[m.requestId]??[];const costs=receipts.flatMap(r=>r.records??[]);
  for(const r of receipts)add('INFERENCE_ACCOUNTING',r.requestKey,r,r.records?.at(-1)?.timestamp??null,'INTERNAL_RESERVATION_AND_USAGE');
  if(m.status==='COMPLETE'&&!accepted)conflicts.push({id:'reconcile_'+reconciliationHash([workspace,m.id,'CLOSURE_BINDING']).slice(0,32),missionId:m.id,code:'CLOSURE_BINDING_UNVERIFIED',severity:'HIGH',safeAutomaticAction:'REBUILD_DERIVED_VIEW_ONLY',source:mission});
  if(evidence.some((e:Row)=>e.status==='MISSING'))conflicts.push({id:'reconcile_'+reconciliationHash([workspace,m.id,'MISSING_EVIDENCE']).slice(0,32),missionId:m.id,code:'REFERENCED_EVIDENCE_MISSING',severity:'HIGH',safeAutomaticAction:'NONE_ESCALATE'});
  const originalText=assessment?.answer??assessment?.content??assessment?.text??null;
  return {missionId:m.id,requestId:m.requestId??null,predecessors:predecessorRecords,historicalMissionStatus:m.status,resolution:m.resolution??null,
   commercial:{status:typeof originalText==='string'&&/evidence[ -]insufficient/i.test(originalText)?'EVIDENCE_INSUFFICIENT':'ASSESSMENT_SPECIFIC_UNVERIFIED',assessmentSha256:assessment?.sha256??null,originalObservedAt:assessment?.at??null,source:assessmentRef,originalTextUnchanged:true},
   technicalWorkflow:{status:accepted?'COMPLETE':m.status==='FAILED'?'FAILED':'UNVERIFIED',acceptedAt:accepted?closure.at:null,source:mission},
   durableResponse:{status:persisted?'VERIFIED':'UNVERIFIED',requestId:m.requestId,sha256:assessment?.sha256??null},
   independentReadback:{status:readback?'COMPLETED_OWNER_ATTESTED':'UNVERIFIED',at:readback?closure.at:null,attestedBy:closure?.advisorReadback?.attestedBy??null,scope:'Exact request and assessment hash; owner-attested historical independent readback, not a new connected-client read'},
   internalAccounting:{status:costs.length?'RECORDED_INTERNAL_USAGE':'UNVERIFIED',callRecords:costs.length,reservedMicroUsd:costs.reduce((n:number,r:Row)=>n+(r.reservedMicroUsd??0),0),estimatedMicroUsd:costs.length&&costs.every((r:Row)=>r.estimatedMicroUsd!==null)?costs.reduce((n:number,r:Row)=>n+r.estimatedMicroUsd,0):null,receipts:receipts.map(r=>r.requestKey)},
   providerInvoices:{status:'UNVERIFIED',settledMicroUsd:null,reason:'Internal usage and reservation receipts are not independently available provider invoices'},
   supersession:accepted?{kind:'LATER_TECHNICAL_EVIDENCE',earlierAssessmentAt:assessment.at,laterAcceptanceAt:closure.at,earlierAssessmentPreserved:true,materialHistoricalClaimsMustUseBothSources:true}:null,
   historicalQualification:accepted?'Earlier uncertainty remains historical; later bound closure verifies technical acceptance only':'No verified superseding technical closure',evidence,memory,locks:{birth:closure?.birth??'UNVERIFIED',commerce:closure?.commerce??'UNVERIFIED',historicalOnly:true},grantsAuthority:false};
 });
 return {schema:'empire-reconciliation-v1',workspace,sourceDigest:reconciliationHash(s),investigations,sources,conflicts,readOnly:true,inferenceCalls:0,commerceEffects:0,grantsAuthority:false};
}
function indexPath(root:string,w:string){safeKey(w);const dir=path.join(root,'commissioning');if(fs.realpathSync(dir)!==dir)throw Error('RECONCILIATION_PATH');return path.join(dir,'reconciliation-'+w+'.json');}
export function rebuildReconciliation(root:string,w:string,revision=process.env.RAILWAY_GIT_COMMIT_SHA??'UNKNOWN'){
 const projection=reconcileSources(w,readReconciliationSources(root,w));const value={...projection,materializedAt:new Date().toISOString(),revision};const envelope={value,sha256:reconciliationHash(value)};const file=indexPath(root,w),tmp=file+'.'+randomUUID()+'.tmp';
 if(fs.existsSync(file)&&(!fs.lstatSync(file).isFile()||fs.realpathSync(file)!==file))throw Error('RECONCILIATION_PATH');
 const fd=fs.openSync(tmp,'wx',0o600);try{fs.writeFileSync(fd,JSON.stringify(envelope));fs.fsyncSync(fd);}finally{fs.closeSync(fd);}fs.renameSync(tmp,file);const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}return {status:'REBUILT',sha256:envelope.sha256,sourceDigest:value.sourceDigest,revision};
}
export function verifyReconciliation(root:string,w:string){
 try{const file=indexPath(root,w);if(!fs.existsSync(file))return {status:'MISSING',healthy:false};if(!fs.lstatSync(file).isFile()||fs.realpathSync(file)!==file||fs.statSync(file).size>8000000)throw Error('PATH');const v=JSON.parse(fs.readFileSync(file,'utf8'));if(v.value?.workspace!==w||v.value?.schema!=='empire-reconciliation-v1'||v.sha256!==reconciliationHash(v.value))return {status:'CORRUPT',healthy:false};if(v.value.sourceDigest!==reconciliationHash(readReconciliationSources(root,w)))return {status:'STALE',healthy:false};return {status:'VERIFIED',healthy:true,sha256:v.sha256,value:v.value};}catch{return {status:'UNAVAILABLE',healthy:false};}
}
export function readReconciliation(root:string,w:string){const v=verifyReconciliation(root,w);return v.healthy?{...v.value,indexStatus:v.status}:{...reconcileSources(w,readReconciliationSources(root,w)),indexStatus:v.status,source:'VERIFIED_LOCAL_SOURCE_FALLBACK',materializedAt:null};}
export function pillowReconciliationContext(workspace:string){const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;if(!root||process.env.EMPIRE_RUNTIME_PROFILE!=='LOCKED_COMMISSIONING_V1')return null;return readReconciliation(root,workspace);}
