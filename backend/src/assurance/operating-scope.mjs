import {currentMissionDomains} from './closure-health.mjs';

// Owner's 2026-10-09 targeted remediation mandate: distinguish current internal
// monitoring from uncommissioned/on-demand external verification. This never
// asserts fresh provider functionality, commerce readiness or Work 8 acceptance.
export const scopePolicy='work7-current-monitoring-20261009-v1';
const scheduled=new Map([['amazon.account',86400000],['amazon.catalog',21600000],['cj.catalog',21600000],['internet.safety',86400000],['empire.state',900000]]);
const onDemand=new Set(['amazon.offers','amazon.fees','amazon.analytics','amazon.restrictions','amazon.requirements','amazon.orders','amazon.advertising','amazon.opportunity','cj.detail','cj.stock','cj.freight','keepa.history','internet.research','internet.trends','internet.reviews']);
const time=(s,now)=>Number.isFinite(Date.parse(s))&&Date.parse(s)<=now;

/** Fail closed unless the complete source inventory supports this exact scope.
 * A disposition closes a misclassified recurring incident, not a failed function.
 * The original DEGRADED/NOT_CHECKED/EXTERNALLY_BLOCKED probe remains unchanged.
 */
export function operatingScopeDisposition(probe,context,now){
 if(context?.profile!=='LOCKED_COMMISSIONING_V1'||!Number.isSafeInteger(context.observedAt)||context.observedAt>now||now-context.observedAt>90000)return null;
 const checks=context.coverage?.receipt?.checks;
 if(!checks||currentMissionDomains.some(d=>checks[d]?.status!=='PASS')||Object.values(checks).some(c=>['FAIL','STALE','SOURCE_UNAVAILABLE'].includes(c.status)))return null;
 if(!Number.isSafeInteger(context.coverage.due)||context.coverage.due<0||context.coverage.due>now||now-context.coverage.due>420000||checks['pillow-omissions']?.inventory?.complete!==true||checks['pillow-omissions']?.inventory?.pending!==0)return null;
 if(probe.id!==probe.capability||probe.classification!==probe.id||!['DEGRADED','NOT_CHECKED','EXTERNALLY_BLOCKED'].includes(probe.status))return null;
 let basis;
 if(probe.id==='provider_configuration'){
  const e=probe.evidence;
  if(!Array.isArray(e?.providers)||!e.providers.length||new Set(e.providers.map(p=>p.provider)).size!==e.providers.length)return null;
  if(e.providers.some(p=>!['openai','anthropic','gemini'].includes(p.provider)||p.retainedResponseVerified!==true||!p.evidenceId||!time(p.observedAt,now)||!['HEALTHY','DEGRADED'].includes(p.status)||!['RECENT_ACCOUNTED_PROVIDER_RESPONSE','FUNCTIONAL_EVIDENCE_STALE'].includes(p.reason)))return null;
  basis='Complete passive receipts contain no latest failed/uncertain call. Periodic paid generation is not commissioned by this monitoring mission. Current external generation remains UNVERIFIED; application delivery is independently checked.';
 }else if(probe.id==='four_eyes_reads'){
  const reads=probe.evidence,schedules=context.schedules;
  if(!Array.isArray(reads)||reads.length!==scheduled.size+onDemand.size||new Set(reads.map(r=>r.id)).size!==reads.length||reads.some(r=>!scheduled.has(r.id)&&!onDemand.has(r.id)))return null;
  if(!Array.isArray(schedules)||schedules.length!==scheduled.size||new Set(schedules.map(s=>s.id)).size!==scheduled.size||context.uncertainJobs!==0||context.activeJobs!==0)return null;
  for(const [id,interval]of scheduled){
   const r=reads.find(r=>r.id===id),s=schedules.find(s=>s.id===id);
   if(!s||s.enabled!==true||s.intervalMs!==interval||!time(s.lastQueuedAt,now)||!r||r.failure||!time(r.lastGoodAt,now)||!['HEALTHY','DEGRADED'].includes(r.status))return null;
   // Operational cadence is distinct from evidence's six-hour commercial TTL.
   // Never relabel old source facts as fresh. An overdue collector still blocks.
   if(now-Date.parse(s.lastQueuedAt)>interval+120000||now-Date.parse(r.lastGoodAt)>Math.max(interval,21600000)+120000)return null;
  }
  for(const r of reads.filter(r=>onDemand.has(r.id))){
   if(r.status==='HEALTHY')continue;
   if(r.status==='DEGRADED'&&r.reason==='EVIDENCE_STALE'&&!r.failure&&time(r.lastGoodAt,now))continue;
   if(r.status==='NOT_CHECKED'&&['MONITOR_NOT_IMPLEMENTED','FUNCTIONAL_EVIDENCE_UNAVAILABLE'].includes(r.reason)&&!r.failure)continue;
   if(r.id==='keepa.history'&&r.reason==='PROVIDER_NOT_CONFIGURED'&&context.keepa?.blocksCoreClosure===false&&context.keepa?.decision==='PROPOSED')continue;
   if(r.id==='amazon.analytics'&&r.reason==='PROVIDER_ACCESS_UNAVAILABLE'&&r.failure==='HTTP_403')continue;
   return null;
  }
  basis='All five commissioned recurring collectors are within their stored cadence, with no active or interrupted jobs. Other declared capabilities are on-demand, unimplemented or access-dependent. Their original evidence classifications remain visible and unverified where applicable.';
 }else return null;
 return {policy:scopePolicy,disposition:'MISCLASSIFIED_RECURRING_REQUIREMENT',observedAt:context.observedAt,coverageCycle:context.coverage.due,basis,externalFunctionality:'UNVERIFIED_WHERE_STALE_OR_MISSING',work8Certified:false};
}

// A later scope correction cannot erase an actual failure hidden in the original
// event history. Require a bound successful response/read after every such fault.
export function scopeHistoryCompatible(history,current){
 if(!history.length||history.length>5000)return false;
 for(const event of history){
  const old=event.body?.probe;if(!old)return false;
  const rows=Array.isArray(old.evidence)?old.evidence:old.evidence?.providers;
  const bad=Array.isArray(rows)?rows.filter(r=>r.status==='FAILED'||['LATEST_CALL_NOT_VERIFIED_COMPLETE','FUNCTIONAL_RECEIPT_INVALID'].includes(r.reason)||(r.failure&&!(r.id==='amazon.analytics'&&r.failure==='HTTP_403'))):[];
  if(['FAILED','UNAVAILABLE','STALE','BLOCKED'].includes(old.status)&&!bad.length)return false;
  for(const fault of bad){
   const sources=Array.isArray(current.evidence)?current.evidence:current.evidence?.providers;
   const next=sources?.find(r=>fault.provider?r.provider===fault.provider:r.id===fault.id);
   if(!next?.evidenceId||next.failure||!['HEALTHY','DEGRADED'].includes(next.status))return false;
   if(fault.provider){if(next.retainedResponseVerified!==true||Date.parse(next.observedAt)<=event.at)return false;}
   else if(!Number.isFinite(Date.parse(next.lastGoodAt))||Date.parse(next.lastGoodAt)<=event.at)return false;
  }
 }
 return true;
}
