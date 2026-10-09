import type {Candidate} from './contracts.js';
import type {IntelligenceStore} from '../../../intelligence/store.js';
import {digest} from './store.js';
/** Resolve claims against the existing Four Eyes store. Caller text cannot manufacture LIVE_PROVIDER evidence. */
export function validateSavedResearch(candidate:Candidate,store:IntelligenceStore,workspace:string,now=Date.now()){
 const refs=[candidate.offer.provenance,...candidate.evidence.map(e=>e.provenance)];
 for(const ref of refs){if(ref.classification==='SYNTHETIC')throw Error('MIXED_RESEARCH_AUTHENTICITY');const source=store.get(workspace,'evidence',ref.reference);if(!source||source.authenticity!=='LIVE_PROVIDER'||source.digest!==ref.sha256||digest(source.facts)!==source.digest||Date.parse(source.staleAfter)<=now||Date.parse(source.observedAt)>now)throw Error('SAVED_RESEARCH_UNVERIFIED');if(ref.observedAt!==source.observedAt||ref.expiresAt!==source.staleAfter)throw Error('EVIDENCE_CHRONOLOGY_MISMATCH');}
 const offerSource=store.get(workspace,'evidence',candidate.offer.provenance.reference)!;
 if(offerSource.provider!=='CJ'||offerSource.subject?.id!==candidate.offer.productId||offerSource.subject?.variant!==candidate.offer.variantId||offerSource.subject?.destination!==candidate.offer.destination)throw Error('SUPPLIER_SOURCE_IDENTITY_MISMATCH');
 // Provider facts are evidence, not independent verification of demand, compliance or payment.
 // Existing qualification requires those explicit reviewed signals; do not infer them from catalogue access.
 return {sourceIds:refs.map(r=>r.reference),verifiedSources:refs.length};
}
