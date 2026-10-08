/** Owner-authorised continuation of the verified 2026-10-08 production checkpoint.
 * These exact receipts may carry across this readback/context-only correction.
 * Runtime closure still rechecks source preservation and canonical recovery evidence.
 * This is NOT a general acceptance exemption for arbitrary older revisions.
 */
export const retainedAcceptance={
 revision:'6826b752906cd2cf0db7da7a9b705cc2c375b8d5',
 preservationManifestSha256:'1d8bbba8b9918bd9bf5f7ac066d9ab3b2d78d56ec53f4808d130e23ca2185524',
 ids:{AUTOMATIC:'owner_c954d2d7-d92d-441b-9b1e-d8c95786ef21',API_ADVISOR:'owner_f84c0566-d846-426e-a44f-bb5ea412536e',OWNER_APPROVAL:'owner_fb2ea2c3-b763-435d-8584-3c8b45435c9b',MONITOR_FAILURE:'owner_786864fa-d97f-411a-8f93-675b74cae336',DEPLOYMENT_COLLISION:'owner_baabe720-edc6-4d8c-ad0a-cd178ad7ef21'},
 scope:'READBACK_CONTEXT_AND_SUMMARY_CORRECTION_ONLY; retained evidence is not new acceptance on the correction revision',
};
export function acceptanceRevisionEligible(h:{revision:string;mode:string;id:string;preservation?:{manifestSha256?:string}},revision:string){return h.revision===revision||(h.revision===retainedAcceptance.revision&&retainedAcceptance.ids[h.mode as keyof typeof retainedAcceptance.ids]===h.id&&h.preservation?.manifestSha256===retainedAcceptance.preservationManifestSha256);}
