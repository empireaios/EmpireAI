import {readReconciliation} from '../assurance/evidence-reconciliation.js';
import {readPillow} from './pillow-read.js';
import {productionIntelligence} from '../intelligence/store.js';
import {readIntelligence,intelligenceDomains} from '../intelligence/runtime.js';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { readCommissioningAccounting } from '../runtime/owner-commissioning-readback.js';
import { inferenceLedgerPath } from '../brain/llm/locked-inference.js';
import { getPillowCapabilityRegistry } from '../orchestration/pillow-host/pillow-capability-registry.js';
import { getChatRequest } from '../runtime/pillow-chat-request-store.js';
import { packageFormat } from './package.js';
import type { AdvisorStore } from './store.js';
import {productionMemory} from '../institutional-memory/store.js';
const domains={
 authority:['pillow_birth_record','workspace_id AS id,status,birth_timestamp,authorised_by,authorised_at,updated_at','workspace_id'],
 commissioning:['pillow_one_product_commissioning','commissioning_id AS id,record_json,updated_at','commissioning_id'],
 approvals:['pillow_approval_requests','approval_id AS id,status,type,record_json,created_at,updated_at','approval_id'],
 execution:['execution_layer_packages','package_id AS id,package_type,company_id,record_json,created_at','package_id'],
 products:['products','id,name,score,demand,margin_cents,trend'],
 orders:['orders','id,company_id,company_name,product_name,total_cents,profit_cents,status,created_at'],
 decisions:['decisions','id,module,title,status,agent_id,authority_level,rationale,created_at,resolved_at'],
 events:['activity_events','id,agent_name,action,module,outcome,created_at'],
 finance:['financial_ledger_events','id,company_id,event_type,amount_cents,currency,direction,correlation_id,source,description,created_at'],
 integrations:['workspace_integrations','id,name,status'],
 memory:['memory_records','id,scope,agent_id,memory_key,value,created_at,updated_at'],
} as const;
export function redact(value:unknown):unknown {
 if(typeof value==='string'){
  let text=value;
  for(const [key,secret] of Object.entries(process.env))if(/PASSWORD|SECRET|TOKEN|API_KEY/.test(key)&&secret&&secret.length>=6)text=text.split(secret).join('[REDACTED]');
  return text.replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._~-]{12,})/g,'[REDACTED]');
 }
 if(Array.isArray(value))return value.map(redact);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>['credentialPresent','credentialNames'].includes(k)||!/password|secret|credential|authorization|cookie|access.?token|refresh.?token/i.test(k)).map(([k,v])=>[k,redact(v)]));
 return value;
}
function read<T>(filename:string,fn:(db:DatabaseSync)=>T){
 const stat=fs.lstatSync(filename);
 if(!stat.isFile()||fs.realpathSync(filename)!==filename)throw Error('CAPABILITY_GAP');
 const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:50});
 try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF');return {observedAt:stat.mtime.toISOString(),data:fn(db)};}finally{db.close();}
}
export const readDomains=['package_format','changes','state','capabilities','pillow','accounting','assurance','reconciliation','missions','communications',...Object.keys(domains),...intelligenceDomains];
export async function readEmpire(store:AdvisorStore,workspace:string,domain:string,id?:string,after='',limit=20,since?:string):Promise<unknown>{
 const root=process.env.RAILWAY_VOLUME_MOUNT_PATH;
 const base={retrievedAt:new Date().toISOString(),readOnly:true,inferenceCalls:0,externalRefresh:false,workspace,domain,grantsAuthority:false};
 try{
  let data:unknown,observedAt:string|null=null,source='durable stored evidence';
  if(intelligenceDomains.includes(domain)){const intel=productionIntelligence();if(!intel)throw Error('CAPABILITY_GAP');data=readIntelligence(intel,workspace,domain,id,after,limit);source='durable Four Eyes evidence; provider scope, authenticity and freshness are record-specific';}
  else if(domain==='package_format'){data=packageFormat;source='versioned import protocol';}
  else if(domain==='changes'){
   const filename=process.env.DATABASE_PATH;if(!filename)throw Error('CAPABILITY_GAP');
   const record=read(filename,db=>db.prepare('SELECT id,agent_name,action,module,outcome,created_at FROM activity_events WHERE workspace_id=? AND created_at>? AND id>? ORDER BY id LIMIT ?').all(workspace,since??new Date(Date.now()-86400000).toISOString(),after,limit));data=record.data;observedAt=record.observedAt;source='existing activity events only; not a complete changelog for all subsystems';
  }
  else if(domain==='state') {source='current process identity and locked runtime profile';observedAt=base.retrievedAt;data={backendSha:process.env.RAILWAY_GIT_COMMIT_SHA??null,deploymentId:process.env.RAILWAY_DEPLOYMENT_ID??null,profile:process.env.EMPIRE_RUNTIME_PROFILE,birth:process.env.EMPIRE_RUNTIME_PROFILE==='LOCKED_COMMISSIONING_V1'?'NOT_BORN':'UNVERIFIED',commerce:process.env.EMPIRE_RUNTIME_PROFILE==='LOCKED_COMMISSIONING_V1'?'LOCKED':'UNVERIFIED',frontendIdentity:{status:'UNVERIFIED',reason:'Use direct Vercel evidence'},domains:readDomains};}
  else if(domain==='capabilities'){source='existing shared Pillow capability declarations; not live provider verification';data={declared:getPillowCapabilityRegistry(),currentProviderAccess:'UNVERIFIED',commerceEffects:'BLOCKED',amazon:{status:'UNVERIFIED',ownerReportedObservation:{date:'2026-10-07',route:'GET /sellers/v1/marketplaceParticipations',httpStatus:200,scope:'legacy service owner-reported call only; not independently reverified by Work2'},lockedRuntimeAccess:'UNVERIFIED',handover:'Work4 cheap heartbeat; do not revive legacy service'},cj:{status:'UNVERIFIED'},keepa:{status:'UNAVAILABLE'},costCentre:{status:'UNAVAILABLE',handover:'Work5'},truthVocabulary:['AVAILABLE','DEGRADED','UNAVAILABLE','STALE','UNVERIFIED','BLOCKED']};const intel=productionIntelligence();if(intel){const arsenal=intel.arsenal(workspace);const provider=(name:string)=>{const scopes=arsenal.filter(c=>c.provider===name);return {status:scopes.some(c=>c.availability==='AVAILABLE')?'AVAILABLE':scopes.some(c=>c.availability==='DEGRADED')?'DEGRADED':scopes.some(c=>c.availability==='STALE')?'STALE':'UNVERIFIED',scope:'Named read endpoints only; not full provider eligibility or commerce authority',capabilities:scopes.map(c=>({id:c.id,status:c.availability,readState:c.readState,lastVerifiedRead:c.lastVerifiedRead,endpoint:c.verifiedEndpoint})),lockedRuntimeAccess:'See per-capability verified endpoint and timestamp'};};data={...data as object,currentProviderAccess:'PER_CAPABILITY',amazon:provider('Amazon'),cj:provider('CJ'),keepa:provider('Keepa'),arsenalDomain:'arsenal'};source='Shared capability declarations plus current durable named intelligence read receipts';}}
  else if(domain==='accounting'){data=readCommissioningAccounting(inferenceLedgerPath());observedAt=base.retrievedAt;source='existing accounting snapshot; recorded estimates are not provider invoices';}
  else if(domain==='communications'){data=id?store.get(workspace,id):store.list(workspace,after,limit);if(id&&data&&typeof data==='object'&&'request_id' in data&&data.request_id){const r=await getChatRequest(String(data.request_id));if(r&&r.workspaceId===workspace)data={...data,pillow:{source:'PILLOW',status:r.status,failureClass:r.failureClass,result:r.finalResult}};}source='owner-imported Advisor artifacts and internal work-item results';}
  else if(domain==='memory'){const memory=productionMemory();if(!memory)throw Error('CAPABILITY_GAP');data=id==='identity'?memory.identity(workspace):id?memory.get(workspace,id):{identity:memory.identity(workspace),records:memory.list(workspace,after,limit),legacy:'Not migrated: legacy memory is unverified historical context, not CEO experience',ordinaryReadsInvokeInference:false};source='durable institutional identity, immutable executive experiences and append-only lifecycle; authenticity is record-specific';}
  else if(domain==='reconciliation'){if(!root)throw Error('CAPABILITY_GAP');data=readReconciliation(root,workspace);source='Source-qualified durable reconciliation; no inference; owner-attested readback distinguished from fresh independent read';}
  else if(domain==='missions'){data={checkpoint:JSON.parse(fs.readFileSync(new URL('../../../docs/work2/checkpoint.json',import.meta.url),'utf8')),productionVerification:null as unknown,work3:null as unknown,work4:null as unknown};if(root){const receipt=path.join(root,'commissioning','work2-production-verification.json');if(fs.existsSync(receipt)&&fs.statSync(receipt).size<64000)(data as {productionVerification:unknown}).productionVerification=JSON.parse(fs.readFileSync(receipt,'utf8'));const work3=path.join(root,'commissioning','work3-production-verification.json');if(fs.existsSync(work3)&&fs.statSync(work3).size<64000)(data as {work3:unknown}).work3=JSON.parse(fs.readFileSync(work3,'utf8'));const work4=path.join(root,'commissioning','work4-production-verification.json');if(fs.existsSync(work4)&&fs.statSync(work4).size<64000)(data as {work4:unknown}).work4=JSON.parse(fs.readFileSync(work4,'utf8'));}if(root){const defect=path.join(root,'commissioning','work24-integration-verification.json');if(fs.existsSync(defect)&&fs.statSync(defect).size<64000)(data as Record<string,unknown>).work24IntegrationDefect=JSON.parse(fs.readFileSync(defect,'utf8'));}const investigations=productionIntelligence();if(investigations)(data as Record<string,unknown>).candidateInvestigations=investigations.recent(workspace,'investigations',10).map(({assessment,modelSteps,...r})=>({...r,modelStepCount:modelSteps?.length??0,assessment:assessment?{sha256:assessment.sha256,requestId:assessment.requestId,evidenceIds:assessment.evidenceIds}:null}));const {readAdvancedAssurance}=await import('../assurance/runtime.js');(data as Record<string,unknown>).advancedAssurance=(await readAdvancedAssurance(workspace)).controlPlane?.checkpoints??[];source='versioned engineering checkpoint; durable production verification supersedes historical packaged checkpoints';}
  else if(domain==='assurance'){
   if(!root)throw Error('CAPABILITY_GAP');
   const {readOwnerAssurance}=await import(new URL('../../src/assurance/owner-evidence.mjs',import.meta.url).href);
   data=readOwnerAssurance(path.join(root,'commissioning','assurance.sqlite'));const intel=productionIntelligence();if(intel)data={...data as object,intelligence:{scheduler:intel.get(workspace,'scheduler','health'),capabilities:intel.arsenal(workspace).map(c=>({id:c.id,status:c.availability,lastGoodAt:c.lastVerifiedRead})),missingCollectorIsPass:false}};const {readAdvancedAssurance}=await import('../assurance/runtime.js');data={...data as object,...await readAdvancedAssurance(workspace)};source='independent Assurance evidence, governed recovery receipts and API Advisor tasks';
  }else if(domain==='pillow'){
   if(!root)throw Error('CAPABILITY_GAP');
   const result=await readPillow(root,workspace,id,after,limit,since);
   return redact({...base,...result,source:'Retained Pillow transcripts and durable request state; exact scoped lookup, no inference',observedAt:base.retrievedAt,status:result.status??'AVAILABLE'});
  }else if(domain in domains){
   const spec=domains[domain as keyof typeof domains];const [table,columns]=spec;const key=spec.length===3?spec[2]:'id';
   const filename=process.env.DATABASE_PATH;if(!filename)throw Error('CAPABILITY_GAP');
   const record=read(filename,db=>id?db.prepare(`SELECT ${columns} FROM ${table} WHERE workspace_id=? AND ${key}=?`).get(workspace,id):db.prepare(`SELECT ${columns} FROM ${table} WHERE workspace_id=? AND ${key}>? ORDER BY ${key} LIMIT ?`).all(workspace,after,limit));
   data=record.data; if(Array.isArray(data))data=data.map(decodeRecord);else data=decodeRecord(data);observedAt=record.observedAt;source='durable business database snapshot; timestamp is file persistence time, not external observation';
  }else throw Error('CAPABILITY_GAP');
  if(Buffer.byteLength(JSON.stringify(data??null))>256000)return {...base,status:'DEGRADED',data:null,reason:'Result exceeds bound. Reduce limit or fetch one object.'};
  return redact({...base,status:data===undefined?'UNAVAILABLE':observedAt&&Date.now()-Date.parse(observedAt)>3600000?'STALE':'AVAILABLE',observedAt,source,data:decodeRecord(data)??null,coverage:{limit,after,since:domain==='changes'?since??'previous 24 hours':null,complete:false,providerAccessVerified:false,businessAuthenticity:'UNVERIFIED: stored records may include historical fixtures; not evidence of real commerce',missingFields:'Not stored or not exposed; do not infer approval, execution or complete economics'}});
 }catch{return {...base,status:'UNAVAILABLE',observedAt:null,data:null,reason:'Stored source unavailable or unreadable; no live refresh attempted'};}
}

function decodeRecord(value:unknown):unknown{if(Array.isArray(value))return value.map(decodeRecord);if(!value||typeof value!=='object')return value;const row={...value} as Record<string,unknown>;for(const k of ['record_json','turns','package','result'])if(typeof row[k]==='string'){try{row[k]=JSON.parse(row[k]);}catch{row[k]='UNREADABLE_STORED_DATA';}}return row;}
