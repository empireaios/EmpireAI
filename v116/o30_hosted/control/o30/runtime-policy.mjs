import {digest} from './store.mjs';
const required=['hostedAtomicCreate','credentialReferencesResolvedWithoutDisclosure','independentReadback','ownerAcknowledgementIssuerBound','resendWebhookSecurelyBound','trustedClockOffsetBound','platformResourceCapsApplied','independentTerminationTested','retentionTerminationEnforced','allChargesIncluded'];
// Admission refuses missing evidence. This is NOT a mechanism that imposes a
// platform spending cap; each external control needs its own examined receipt.
export function requireOperatingControls(manifest,approval,controls,now=Date.now()){
 if(controls?.status!=='INDEPENDENTLY_VERIFIED'||required.some(k=>controls.proofs?.[k]!==true)||!controls.reviewReceiptHash||controls.timingContractApproved!==true)throw Error('Operating controls unproven; deployment/transmission refused');
 if(!Number.isFinite(controls.costCeilingUSD)||controls.costCeilingUSD<0||!Number.isSafeInteger(controls.maxDurationMs)||controls.maxDurationMs<=0||typeof controls.timingContractHash!=='string'||!controls.timingContractHash)throw Error('Invalid cost or timing envelope');
 if(!approval||!Number.isFinite(approval.maxCostUSD)||approval.maxCostUSD<0||approval.controlsHash!==digest(controls)||approval.authorised!==true||manifest.timing?.referenceEventVersion!=='O30-PROSPECTIVE-V1'||approval.timingContractHash!==controls.timingContractHash)throw Error('Operating approval does not bind controls');
 const start=Date.parse(approval.startsAt),end=Date.parse(approval.expiresAt);
 if(!Number.isFinite(start)||!Number.isFinite(end)||now<start||now>=end||end-start>1500000||controls.maxDurationMs>1500000||end-start>controls.maxDurationMs||approval.maxCostUSD>controls.costCeilingUSD)throw Error('Operating envelope invalid');
 return {expiresAt:end,maxDurationMs:Math.min(end-now,controls.maxDurationMs)};
}
