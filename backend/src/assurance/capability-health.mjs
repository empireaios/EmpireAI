/** Classification never upgrades unavailable evidence to healthy. */
export function classifyCapability({implemented=true,configured=true,applicable=true,applicabilityEvidence,health,now,maxAgeMs}) {
 if (!implemented) return {status:'NOT_CHECKED',reason:'MONITOR_NOT_IMPLEMENTED'};
 if (!applicable && applicabilityEvidence) return {status:'NOT_APPLICABLE',reason:'CAPABILITY_NOT_YET_APPLICABLE',evidence:applicabilityEvidence};
 if (!configured) return {status:'EXTERNALLY_BLOCKED',reason:'PROVIDER_NOT_CONFIGURED'};
 if (!health) return {status:'NOT_CHECKED',reason:'FUNCTIONAL_EVIDENCE_UNAVAILABLE'};
 const failure=health.failure;
 if (failure) {
  if (failure==='PUBLIC_SOURCE_NOT_APPROVED') return {status:'EXTERNALLY_BLOCKED',reason:'EVIDENCE_NOT_AUTHORISED',failure};
  if (['HTTP_401','HTTP_403','CREDENTIAL_UNAVAILABLE','CJ_AUTH_FAILED'].includes(failure)) return {status:'EXTERNALLY_BLOCKED',reason:'PROVIDER_ACCESS_UNAVAILABLE',failure};
  if (['HTTP_429','HTTP_502','HTTP_503','HTTP_504','BACKOFF_ACTIVE'].includes(failure)) return {status:'EXTERNALLY_BLOCKED',reason:'PROVIDER_UNAVAILABLE',failure};
  return {status:'FAILED',reason:'RECORDED_CAPABILITY_FAILURE',failure};
 }
 const at=Date.parse(health.lastGoodAt??'');
 if (!Number.isFinite(at)) return {status:'NOT_CHECKED',reason:'FUNCTIONAL_EVIDENCE_UNAVAILABLE'};
 if (at>now || !Number.isSafeInteger(maxAgeMs) || maxAgeMs<=0) return {status:'FAILED',reason:'INVALID_EVIDENCE_CLOCK_OR_POLICY'};
 if (now-at>maxAgeMs) return {status:'DEGRADED',reason:'EVIDENCE_STALE',lastGoodAt:health.lastGoodAt};
 return {status:'HEALTHY',reason:'RECENT_RECORDED_FUNCTIONAL_READ',lastGoodAt:health.lastGoodAt};
}

export function aggregateCapabilityHealth(reads) {
 if (!reads.length) return 'NOT_CHECKED';
 if (reads.some(r=>r.status==='FAILED')) return 'FAILED';
 if (reads.every(r=>r.status==='HEALTHY')) return 'HEALTHY';
 if (reads.every(r=>r.status==='NOT_APPLICABLE')) return 'NOT_APPLICABLE';
 if (reads.some(r=>r.status==='DEGRADED')) return 'DEGRADED';
 if (reads.some(r=>r.status==='EXTERNALLY_BLOCKED')) return 'EXTERNALLY_BLOCKED';
 return 'NOT_CHECKED';
}
