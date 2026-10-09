import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {currentMissionDomains} from './closure-health.mjs';

// Exact case authorised for investigation by the owner's 2026-10-09 mandate.
// This policy cannot certify generation, release money, or cover another call.
export const historicalGemini=Object.freeze({
 policy:'gemini-historical-containment-20261009-v2',
 workspace:'ws_empire_1',transcriptRequestId:'7de0aba7-e62a-443a-b567-d1e735679d9f',sessionId:'10ac0f65-ed3b-4664-8f94-f1ea064755c3',
 callId:'2094d132-5fd8-4a03-8a2c-b05deff105aa',
 timestamp:'2026-10-02T11:17:14.780Z',model:'gemini-3.8-flash',reservedMicroUsd:288479,
});
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const correlationHash=request=>createHash('sha256').update(historicalGemini.workspace+'\0'+request).digest('hex');
export const historicalRequestText='Summarise this supplied commissioning status in at most 70 words: Pillow is NOT_BORN and commerce is LOCKED. Supplier stock is unverified. Two shipment quotes have expired. The next authorized step is read-only evidence renewal. Clearly distinguish the proposed next step from any action already executed. Do not make external calls or change state.';
export const historicalFailureText='Pillow could not complete this inference request. No completed provider answer is available; the existing request and spending reservation are retained for investigation.';
const quantity=n=>Number.isSafeInteger(n)&&n>=0;

// The October 2 host used distinct transcript and transport request IDs. Read
// its retained conversation/correlation link; never infer identity from timing.
function readRequestBinding(filename,requestKey){
 const file=path.join(path.dirname(filename),'pillow-reasoning.sqlite'),stat=fs.lstatSync(file);
 if(!stat.isFile()||stat.nlink!==1||stat.size>32*1024*1024||fs.realpathSync(file)!==file)throw Error('REQUEST_SOURCE_INVALID');
 const db=new DatabaseSync(file,{readOnly:true,allowExtension:false,timeout:1000});
 try{
  db.exec('PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN');
  if(db.prepare('PRAGMA quick_check').get()?.quick_check!=='ok')throw Error('REQUEST_SOURCE_INVALID');
  const rows=db.prepare('SELECT id,request,created,evidence,status FROM pending_learning WHERE workspace=? AND session=? ORDER BY created LIMIT 51').all(historicalGemini.workspace,historicalGemini.sessionId);
  if(rows.length>50)throw Error('REQUEST_COVERAGE_BOUND');
  const matches=rows.filter(r=>typeof r.request==='string'&&r.request.length<=160&&correlationHash(r.request)===requestKey);
  if(matches.length!==1)throw Error('REQUEST_BINDING_UNVERIFIED');
  const r=matches[0],e=JSON.parse(r.evidence);
  const transcript=db.prepare('SELECT turns FROM transcripts WHERE workspace=? AND session=?').get(historicalGemini.workspace,historicalGemini.sessionId);
  const all=JSON.parse(transcript?.turns),turns=all.filter(t=>t.requestId===historicalGemini.transcriptRequestId);
  const user=turns.find(t=>t.role==='user'),answer=turns.find(t=>t.role==='assistant'),at=Date.parse(historicalGemini.timestamp),start=Date.parse(user?.timestamp),end=Date.parse(answer?.timestamp),captured=Date.parse(r.created);
  if(turns.length!==2||r.id!==hash([historicalGemini.workspace,r.request])||r.status!=='pending_owner_review'||e.source!=='conversation'||e.trust!=='untrusted_observation'||e.grantsAuthority!==false||e.user!==historicalRequestText||e.answer!==historicalFailureText||user?.content!==e.user||answer?.content!==e.answer||!Number.isFinite(start)||start>at||at-start>60000||!Number.isFinite(end)||end<at||end-at>180000||!Number.isFinite(captured)||captured<at||captured-at>180000)throw Error('REQUEST_BINDING_UNVERIFIED');
  return {verified:true,requestId:r.request,transcriptRequestId:historicalGemini.transcriptRequestId,sessionId:historicalGemini.sessionId,requestText:e.user,failureText:e.answer,requestAt:user.timestamp,failureAt:answer.timestamp,capturedAt:r.created,pendingLearningSha256:hash(r),transcriptSha256:hash(turns),source:'RETAINED_CONVERSATION_CORRELATION_AND_TRANSCRIPT',grantsAuthority:false};
 }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
}

/** Called inside the existing read-only ledger transaction. No source writes.
 * The route file is local retained transport evidence, not provider billing proof.
 */
export function readHistoricalProviderEvidence(db,filename){
 const base={policy:historicalGemini.policy,transcriptRequestId:historicalGemini.transcriptRequestId,
  providerSuccess:false,currentProviderHealth:'UNVERIFIED',invoiceVerified:false,
  reservationReleased:false,financialSettlement:'UNCERTAIN'};
 let retained={};
 try{
  const row=db.prepare('SELECT c.*,p.provider,p.request_key FROM calls c JOIN call_providers p ON p.call_id=c.id WHERE c.id=?').get(historicalGemini.callId);
  if(!row)return {...base,status:'INSUFFICIENT_EVIDENCE',reason:'ORIGINAL_CALL_MISSING'};
  const ledger={...row};
  retained={ledger,ledgerSha256:hash(ledger)};
  const requestKey=row.request_key;
  if(typeof requestKey!=='string'||!/^[a-f0-9]{64}$/.test(requestKey))throw Error('REQUEST_KEY_INVALID');
  const requestBinding=readRequestBinding(filename,requestKey);
  retained={...retained,requestKey,requestBinding};
  const dedupe=db.prepare('SELECT id,timestamp FROM inference_requests WHERE id=?').get(requestKey);
  const counts=db.prepare('SELECT count(*) n FROM call_providers WHERE request_key=?').get(requestKey);
  const total=db.prepare('SELECT SUM(reserved_micro_usd) held, count(*) records FROM calls').get();
  const file=filename+'.route-'+requestKey+'.json',stat=fs.lstatSync(file);
  if(!stat.isFile()||stat.nlink!==1||stat.size>1024*1024||fs.realpathSync(file)!==file)throw Error('ROUTE_INVALID');
  const raw=fs.readFileSync(file),route=JSON.parse(raw.toString('utf8'));
  const at=Date.parse(row.timestamp),end=Date.parse(route.at),start=Date.parse(dedupe?.timestamp);
  const identity=row.provider==='gemini'&&correlationHash(requestBinding.requestId)===requestKey&&row.timestamp===historicalGemini.timestamp&&row.model===historicalGemini.model;
  const held=row.status==='failed_uncertain'&&row.reserved_micro_usd===historicalGemini.reservedMicroUsd&&row.usage_json===null&&row.provider_response_id===null&&row.estimated_micro_usd===null&&row.invoice_actual_micro_usd===null;
  const replay=dedupe?.id===requestKey&&Number.isFinite(start)&&start<=at&&at-start<=60000&&counts?.n===1;
  const a=route.attempts?.[0],r=route.records?.[0];
  const refusal=route.schema==='locked-inference-operator-readback-v1'&&route.requestKey===requestKey&&['reasoning','analysis','summarization','critique'].includes(route.capability)&&Number.isFinite(end)&&end>=at&&end-at<=180000&&route.attempts?.length===1&&a.provider==='gemini'&&a.model===row.model&&a.outcome==='temporary_refusal'&&a.httpStatus===503;
  const bound=route.records?.length===1&&r.id===row.id&&r.timestamp===row.timestamp&&r.model===row.model&&r.provider==='gemini'&&r.request_key===requestKey&&r.status===row.status&&r.reserved_micro_usd===row.reserved_micro_usd&&r.estimated_micro_usd===null&&r.invoice_actual_micro_usd===null&&r.provider_response_id===null&&r.usage===null&&r.reservationReleased===false;
  const accounting=quantity(total?.held)&&total.held>=row.reserved_micro_usd&&quantity(route.heldMicroUsd)&&route.heldMicroUsd>=row.reserved_micro_usd;
  return {...base,requestKey,requestBinding,status:identity&&held&&replay&&refusal&&bound&&accounting?'VERIFIED_CONTAINMENT_EVIDENCE':'INSUFFICIENT_EVIDENCE',
   classification:'C_UNCERTAIN_PROVIDER_EXECUTION_OR_FINANCIAL_SETTLEMENT',
   checks:{identity,held,replay,refusal,bound,accounting},ledger,dedupe:dedupe??null,
   route:{at:route.at??null,requestKey:route.requestKey??null,capability:route.capability,attempts:refusal?[{provider:a.provider,model:a.model,outcome:a.outcome,httpStatus:a.httpStatus}]:null,sha256:createHash('sha256').update(raw).digest('hex')},
   ledgerSha256:hash(ledger),cumulativeHeldMicroUsd:total.held,accountingRecords:total.records,
   meaning:'Retained HTTP refusal and failed application attempt; provider processing, usage and invoice settlement remain uncertain. Original full reservation retained in cumulative Cost Guard.'};
 }catch{return {...base,...retained,status:'INSUFFICIENT_EVIDENCE',reason:'HISTORICAL_SOURCE_MISSING_OR_INVALID'};}
}

export function historicalProviderDisposition(workspace,probe,context,now){
 if(workspace!==historicalGemini.workspace||probe.id!=='provider_configuration'||probe.capability!==probe.id||probe.classification!==probe.id||probe.status!=='DEGRADED')return null;
 if(context?.profile!=='LOCKED_COMMISSIONING_V1'||!Number.isSafeInteger(context.observedAt)||context.observedAt>now||now-context.observedAt>90000)return null;
 const checks=context.coverage?.receipt?.checks;
 if(!checks||currentMissionDomains.some(d=>checks[d]?.status!=='PASS')||Object.values(checks).some(c=>['FAIL','STALE','SOURCE_UNAVAILABLE'].includes(c.status)))return null;
 if(!Number.isSafeInteger(context.coverage.due)||context.coverage.due>now||now-context.coverage.due>420000||checks['pillow-omissions']?.inventory?.complete!==true||checks['pillow-omissions']?.inventory?.pending!==0)return null;
 const e=probe.evidence,proof=e?.historicalReconciliation,rows=e?.providers;
 if(proof?.status!=='VERIFIED_CONTAINMENT_EVIDENCE'||proof.policy!==historicalGemini.policy||proof.ledger?.id!==historicalGemini.callId||proof.requestBinding?.verified!==true||typeof proof.requestBinding.requestId!=='string'||proof.requestKey!==correlationHash(proof.requestBinding.requestId)||proof.requestKey!==proof.ledger.request_key||proof.reservationReleased!==false||proof.providerSuccess!==false||proof.financialSettlement!=='UNCERTAIN')return null;
 if(!Array.isArray(rows)||rows.length!==3||new Set(rows.map(r=>r.provider)).size!==3)return null;
 for(const r of rows){
  if(r.provider==='gemini'){
   if(r.evidenceId!==historicalGemini.callId||r.observedAt!==historicalGemini.timestamp||r.status!=='DEGRADED'||r.reason!=='LATEST_CALL_NOT_VERIFIED_COMPLETE'||r.retainedResponseVerified===true)return null;
  }else if(!['openai','anthropic'].includes(r.provider)||r.retainedResponseVerified!==true||!r.evidenceId||!Number.isFinite(Date.parse(r.observedAt))||Date.parse(r.observedAt)>now||!['HEALTHY','DEGRADED'].includes(r.status)||!['RECENT_ACCOUNTED_PROVIDER_RESPONSE','FUNCTIONAL_EVIDENCE_STALE'].includes(r.reason))return null;
 }
 return {policy:historicalGemini.policy,disposition:'ADMINISTRATIVELY_RESOLVED_HISTORICAL_FAILURE',
  observedAt:context.observedAt,coverageCycle:context.coverage.due,proof,
  providerSuccess:false,currentProviderHealth:'UNVERIFIED',invoiceVerified:false,reservationReleased:false,financialSettlement:'UNCERTAIN',
  basis:'Only the exact sealed historical request is contained. No pending application omissions; all seven independent current domains PASS. New calls, missing evidence and other failures remain blocking. No inference recovery or financial settlement performed.'};
}

// Complete immutable history is mandatory. This deliberately does not modify
// operating-scope's requirement for later functional evidence after real faults.
const legacyConfigurationIncidents=new Map([
 ['inc_d4e3fb2e-c767-488c-af75-41419e08455e','6826b752906cd2cf0db7da7a9b705cc2c375b8d5'],
 ['inc_9f3a1a0c-aa84-43e9-a436-91c8ce47e1cc','f0b5322fe9caad3e75f31e8080afd5db7f8c7346'],
]);
// These two retained incidents predate receipt-based monitoring. Their complete
// history must contain only the exact configuration-only schema from their
// original revisions. Configuration is never treated as generation evidence.
function legacyConfigurationHistory(history,current,incident){
 const revision=legacyConfigurationIncidents.get(incident?.id),proof=current?.evidence?.historicalReconciliation;
 if(!revision||incident.revision!==revision||incident.probeId!=='provider_configuration'||incident.capability!==incident.probeId||incident.classification!==incident.probeId||incident.severity!=='HIGH'||incident.synthetic!==false||incident.attempts!==0||incident.fingerprint!==hash([incident.capability,incident.classification,incident.probeId,revision]))return false;
 if(proof?.status!=='VERIFIED_CONTAINMENT_EVIDENCE'||proof.policy!==historicalGemini.policy||proof.requestBinding?.verified!==true||typeof proof.requestBinding.requestId!=='string'||proof.requestKey!==correlationHash(proof.requestBinding.requestId)||proof.requestKey!==proof.ledger?.request_key||proof.ledger?.id!==historicalGemini.callId||proof.providerSuccess!==false||proof.reservationReleased!==false||proof.financialSettlement!=='UNCERTAIN')return false;
 return history.every(event=>{
  const p=event.body?.probe,e=p?.evidence;
  return (event.body?.incident?.id??event.body?.incidentId)===incident.id&&p?.revision===revision&&p.id==='provider_configuration'&&p.capability===p.id&&p.classification===p.id&&p.status==='UNVERIFIED'&&p.summary==='Configured credentials are not a functional provider-call verification'&&e&&Object.keys(e).sort().join(',')==='configured,inferenceCalls'&&e.inferenceCalls===0&&Array.isArray(e.configured)&&e.configured.length===3&&[...e.configured].sort().join(',')==='anthropic,gemini,openai';
 });
}
export function historicalProviderHistoryCompatible(history,current,incident){
 if(!history.length||history.length>5000)return false;
 if(legacyConfigurationHistory(history,current,incident))return true;
 return history.every(event=>{
  const p=event.body?.probe,rows=p?.evidence?.providers;
  if(p?.id!=='provider_configuration'||p.capability!==p.id||p.classification!==p.id||p.status!=='DEGRADED'||!Array.isArray(rows)||rows.length!==3||new Set(rows.map(r=>r.provider)).size!==3)return false;
  return rows.every(r=>{
   // Before PR100, age was checked before completion. Bind those stale labels
   // to this exact failed call; never reinterpret the old observation as success.
   if(r.provider==='gemini')return r.evidenceId===historicalGemini.callId&&r.observedAt===historicalGemini.timestamp&&r.status==='DEGRADED'&&r.retainedResponseVerified!==true&&['LATEST_CALL_NOT_VERIFIED_COMPLETE','FUNCTIONAL_EVIDENCE_STALE'].includes(r.reason);
   const verified=current?.evidence?.providers?.find(n=>n.provider===r.provider);
   return ['openai','anthropic'].includes(r.provider)&&['HEALTHY','DEGRADED'].includes(r.status)&&['RECENT_ACCOUNTED_PROVIDER_RESPONSE','FUNCTIONAL_EVIDENCE_STALE'].includes(r.reason)&&verified?.retainedResponseVerified===true&&
    ((verified.evidenceId===r.evidenceId&&verified.observedAt===r.observedAt)||Date.parse(verified.observedAt)>event.at);
  });
 });
}
