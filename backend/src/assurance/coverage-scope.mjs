const futureCommerce = new Set(['marketplace-orders','supplier-fulfilment-tracking','listing-drift','money-transactions','refunds-reimbursements']);
/** Disclose implementation and contractual scope separately from check results.
 * NOT_APPLICABLE below applies to this mission's future-Work implementation scope,
 * never to the existence of external orders, charges, or account activity.
 */
export function coverageScope(source, check) {
 if(futureCommerce.has(source))return {missionScope:'FUTURE_WORK_6_INTEGRATION',scopeStatus:'NOT_APPLICABLE',externalEvidence:'UNVERIFIED',operationalConsequence:'External commerce reconciliation is not implemented; no absence of external activity is established'};
 if(source==='provider-accounting')return {missionScope:'INTERNAL_ACCOUNTING_PRESERVATION; LIVE_BILLING_WORK_5',scopeStatus:check.status==='PASS'?'HEALTHY':'NOT_CHECKED',externalEvidence:'UNVERIFIED',operationalConsequence:'Internal receipts are not provider invoices or settled charges'};
 if(source==='persistence-backups-recovery')return {missionScope:'LOCAL_STORAGE_INTEGRITY',scopeStatus:check.status==='PASS'?'HEALTHY':'NOT_CHECKED',externalEvidence:'UNVERIFIED',operationalConsequence:'Local integrity does not establish an independent backup or a tested restore'};
 return {missionScope:'CURRENT_INTERNAL_MONITORING',scopeStatus:check.status==='PASS'?'HEALTHY':check.status==='FAIL'?'FAILED':check.status==='STALE'?'DEGRADED':'NOT_CHECKED'};
}
