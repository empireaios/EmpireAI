import fs from 'node:fs';import path from 'node:path';import {DatabaseSync} from 'node:sqlite';
import {digest} from '../intelligence/model.js';
type Row=Record<string,any>;
/** Fixed, bounded, workspace-scoped reads; body content is never emitted by the probe. */
function readRows(root:string,file:string,sql:string,workspace:string,limit:number){const filename=path.join(root,'commissioning',file);if(fs.realpathSync(filename)!==filename||!fs.lstatSync(filename).isFile())throw Error('RESPONSE_SOURCE_PATH');const db=new DatabaseSync(filename,{readOnly:true,allowExtension:false,timeout:1000});try{db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');const metadataSql=sql.replace(/^SELECT (?:id|request id),body /,'SELECT length(CAST(body AS BLOB)) bytes ');if(metadataSql===sql)throw Error('RESPONSE_SOURCE_QUERY');const sizes=db.prepare(metadataSql).all(workspace,limit+1);if(sizes.length>limit||sizes.reduce((n,r)=>n+Number(r.bytes),0)>4194304)throw Error('RESPONSE_SOURCE_BOUND');const rows=db.prepare(sql).all(workspace,limit+1);return rows.map(r=>({key:String(r.id),value:JSON.parse(String(r.body)) as Row}));}finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}}
/** Verifies technical binding only: matching words do not establish their truth,
 * product qualification, owner acceptance, or permission for another model call. */
export function readWork8ResponseBinding(root:string,workspace:string,now=Date.now()){
 const base={id:'response_evidence_linkage',capability:'response_evidence_linkage',classification:'response_evidence_linkage',severity:'HIGH',runbookId:null};
 try{
  if(!/^[A-Za-z0-9_.:-]{1,160}$/.test(workspace))throw Error('RESPONSE_WORKSPACE');
  const missions=readRows(root,'intelligence.sqlite',"SELECT id,body FROM objects WHERE workspace=? AND kind='investigations' ORDER BY id LIMIT ?",workspace,1000),requests=readRows(root,'pillow-request-receipts.sqlite','SELECT request id,body FROM receipts WHERE workspace=? ORDER BY request LIMIT ?',workspace,10000),evidence=readRows(root,'intelligence.sqlite',"SELECT id,body FROM objects WHERE workspace=? AND kind='evidence' ORDER BY id LIMIT ?",workspace,10000);
  const byRequest=new Map(requests.map(r=>[r.key,r.value])),byEvidence=new Map(evidence.map(r=>[r.key,r.value]));const faults:Array<{missionId:string;code:string}>=[],pending:Array<{missionId:string;code:string}>=[],verified:string[]=[];
  for(const {key:missionId,value:m} of missions){
   const fail=(code:string)=>faults.push({missionId,code}),wait=(code:string)=>pending.push({missionId,code});
   if(m.id!==missionId)throw Error('RESPONSE_MISSION_IDENTITY');const a=m.assessment;if(!a){if(!['FAILED'].includes(m.status))wait('ASSESSMENT_NOT_AVAILABLE');continue;}
   const initialFaults=faults.length,initialPending=pending.length;
   if(!['ASSESSED_PENDING_ACCEPTANCE','COMPLETE'].includes(m.status))wait('ASSESSMENT_NOT_CURRENT');
   if(typeof a.answer!=='string'||!a.answer.trim())fail('ASSESSMENT_EMPTY');
   if(a.requestId!==m.requestId||typeof m.requestId!=='string'||digest(a.answer)!==a.sha256)fail('ASSESSMENT_REQUEST_OR_HASH_MISMATCH');
   const request=byRequest.get(m.requestId);
   if(!request)wait('DURABLE_REQUEST_MISSING');
   else if(request.requestId!==m.requestId||request.workspaceId!==workspace)fail('REQUEST_SCOPE_MISMATCH');
   else if(request.status!=='COMPLETED')wait('DURABLE_RESPONSE_NOT_COMPLETE');
   else if(typeof request.finalResult?.message!=='string'||!request.finalResult.message.trim()||digest(request.finalResult.message)!==a.sha256)fail('DURABLE_RESPONSE_MISMATCH');
   if(!Array.isArray(m.rounds)||!m.rounds.length||m.rounds.some((r:Row)=>r.status!=='RECORDED'))wait('EVIDENCE_ROUNDS_NOT_COMPLETE');
   const delivered=Array.isArray(m.rounds)?[...new Set<string>(m.rounds.flatMap((r:Row)=>Array.isArray(r.deliveredEvidenceIds)?r.deliveredEvidenceIds:[]))].sort():[];
   if(!Array.isArray(a.evidenceIds)||a.evidenceIds.some((id:unknown)=>typeof id!=='string')||digest([...new Set(a.evidenceIds)].sort())!==digest(delivered))fail('ASSESSMENT_DELIVERED_EVIDENCE_MISMATCH');
   if(!delivered.length)wait('NO_DELIVERED_EVIDENCE');
   for(const id of delivered){const e=byEvidence.get(id);if(!e){fail('REFERENCED_EVIDENCE_MISSING');continue;}if(e.id!==id||e.grantsAuthority!==false||!['LIVE_PROVIDER','INTERNAL_UNVERIFIED'].includes(e.authenticity)||digest(e.facts)!==e.digest)fail('REFERENCED_EVIDENCE_INTEGRITY');}
   // Historical pin integrity is distinct from present-day source eligibility.
   // Unbound investigations remain technical responses, never product assessments.
   if(m.candidateBinding||a.candidateBinding){
    const pin=m.candidateBinding;
    if(!pin||!a.candidateBinding||digest(pin)!==digest(a.candidateBinding)||typeof pin.candidateId!=='string'||typeof pin.productId!=='string'||pin.subject?.id!==pin.productId||!Array.isArray(pin.evidence)||!pin.evidence.length||digest(pin.evidence)!==pin.snapshotDigest)fail('CANDIDATE_BINDING_MISMATCH');
    const proof=m.candidateContextDelivery;
    if(!proof)fail('CANDIDATE_CONTEXT_NOT_DELIVERED');
    else {const {digest:proofDigest,...body}=proof,deliveredAt=Date.parse(proof.deliveredAt),createdAt=Date.parse(m.createdAt),assessedAt=Date.parse(a.at);if(proofDigest!==digest(body)||proof.requestId!==m.requestId||proof.bindingDigest!==digest(pin)||!Array.isArray(pin?.evidence)||digest(proof.evidenceIds)!==digest(pin.evidence.map((e:Row)=>e.id))||proof.snapshotDigest!==pin.snapshotDigest||![deliveredAt,createdAt,assessedAt].every(Number.isFinite)||deliveredAt<createdAt||assessedAt<deliveredAt||assessedAt>now)fail('CANDIDATE_CONTEXT_DELIVERY_UNVERIFIED');}
    if(m.status==='COMPLETE'&&(m.closure?.owner!==m.owner||Date.parse(m.closure?.at)>now))fail('CANDIDATE_OWNER_OR_CHRONOLOGY_MISMATCH');
    if(Array.isArray(pin?.evidence))for(const ref of pin.evidence){const source=byEvidence.get(ref.id);if(!source||source.id!==ref.id||digest(source)!==ref.envelopeDigest||source.grantsAuthority!==false||source.authenticity!=='LIVE_PROVIDER'||digest(source.facts)!==source.digest)fail('CANDIDATE_SOURCE_PIN_MISMATCH');}
   }
   if(m.status==='COMPLETE'){const c=m.closure;if(!c||c.advisorReadback?.requestId!==m.requestId||c.advisorReadback?.assessmentHash!==a.sha256||!Number.isFinite(Date.parse(c.at))||!Number.isFinite(Date.parse(a.at))||Date.parse(c.at)<Date.parse(a.at))fail('CLOSURE_BINDING_UNVERIFIED');}
   if(faults.length===initialFaults&&pending.length===initialPending)verified.push(missionId);
  }
  const status=faults.length?'FAILED':pending.length||!verified.length?'UNVERIFIED':'HEALTHY';
  return {...base,status,summary:status==='HEALTHY'?'Fresh durable requests, assessments and delivered evidence bind correctly; commercial claims remain unverified.':status==='FAILED'?'Assessment, durable response or delivered evidence binding conflicts; preserve sources and escalate.':'Assessment or durable response binding remains incomplete; no successful assessment is inferred.',evidence:{observedAt:now,missions:missions.length,verifiedBindings:verified.length,candidateQualificationVerified:false,pendingCount:pending.length,faultCount:faults.length,pending:pending.slice(0,20),faults:faults.slice(0,20),sourceDigest:digest({missions,requests,evidence}),faultDigest:digest(faults),scope:'TECHNICAL_RESPONSE_BINDING_NOT_SEMANTIC_TRUTH_OR_PRODUCT_QUALIFICATION',freshnessScope:'CURRENT_READ_OF_HISTORICAL_BINDINGS_NOT_CURRENT_PRODUCT_SOURCE_FRESHNESS',externalEffects:0,inferenceCalls:0}};
 }catch(error){return {...base,status:'UNAVAILABLE',summary:'Bounded response-binding sources are unavailable or corrupt; successful assessment is not inferred.',evidence:{observedAt:now,reason:error instanceof Error&&error.message==='RESPONSE_SOURCE_BOUND'?'RESPONSE_SOURCE_BOUND':'RESPONSE_SOURCE_UNVERIFIED',externalEffects:0,inferenceCalls:0}};}
}
