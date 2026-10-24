import {z} from 'zod';
import {digest} from '../intelligence/model.js';
type Row=Record<string,any>;
const id=z.string().min(1).max(160),scalar=z.union([z.string().max(2000),z.number().finite(),z.boolean(),z.null()]);
const schema=z.object({candidateId:id,snapshotDigest:z.string().regex(/^[a-f0-9]{64}$/),claims:z.array(z.object({sourceId:id,subjectId:id,path:z.array(z.union([z.string().regex(/^[A-Za-z0-9_]{1,80}$/),z.number().int().min(0).max(10000)])).min(1).max(12),value:scalar}).strict()).min(1).max(32)}).strict();
export const sourceClaimContract={tag:'work8-source-claims',instruction:'Optionally append one <work8-source-claims>JSON</work8-source-claims> object: candidateId, snapshotDigest, claims [{sourceId,subjectId,path,value}]. Each path is an array of exact own keys/array indices within the supplied source facts; value is the exact scalar observation, never an inference. Use source subject identity, not a different candidate. Unsupported conclusions remain unverified. Matching an observation creates no qualification or authority.'} as const;
/** Deterministic observation equality only. Neither citations nor arbitrary prose are a truth oracle. */
export function checkWork8SourceClaims(answer:unknown,pin:Row|undefined,sources:Map<string,Row>,now:number){
 const faults:string[]=[],pending:string[]=[];const base={scope:'EXPLICIT_SCALAR_SOURCE_OBSERVATIONS_ONLY',freeProse:'UNVERIFIED',qualification:false,grantsAuthority:false};
 if(typeof answer!=='string'||!answer.includes('<work8-source-claims>'))return {...base,status:'UNVERIFIED',checked:0,faults,pending};
 try{
  if(Buffer.byteLength(answer)>131072)throw Error('SOURCE_CLAIM_BOUND');
  const parts=answer.split('<work8-source-claims>');if(parts.length!==2||answer.split('</work8-source-claims>').length!==2||!parts[1]!.includes('</work8-source-claims>'))throw Error('SOURCE_CLAIM_AMBIGUOUS');
  const raw=parts[1]!.split('</work8-source-claims>')[0]!;if(Buffer.byteLength(raw)>16384)throw Error('SOURCE_CLAIM_BOUND');const claimSet=schema.parse(JSON.parse(raw));
  if(!pin||claimSet.candidateId!==pin.candidateId||claimSet.snapshotDigest!==pin.snapshotDigest||!Array.isArray(pin.evidence))throw Error('SOURCE_CLAIM_CANDIDATE_MISMATCH');
  for(const claim of claimSet.claims){
   const ref=pin.evidence.find((r:Row)=>r.id===claim.sourceId),source=sources.get(claim.sourceId);
   if(!ref||!source||source.id!==claim.sourceId||digest(source)!==ref.envelopeDigest||source.authenticity!=='LIVE_PROVIDER'||source.grantsAuthority!==false||digest(source.facts)!==source.digest){faults.push('SOURCE_CLAIM_UNDELIVERED_OR_UNVERIFIED');continue;}
   if(claim.subjectId!==source.subject?.id||source.subject?.id!==pin.subject?.id){faults.push('SOURCE_CLAIM_SUBJECT_MISMATCH');continue;}
   const observed=Date.parse(source.observedAt),expires=Date.parse(source.staleAfter);if(!Number.isFinite(observed)||!Number.isFinite(expires)||observed>now||expires<=observed||expires<=now)pending.push('SOURCE_CLAIM_STALE_OR_TIME_UNVERIFIED');
   let value:unknown=source.facts;for(const key of claim.path){if(['__proto__','prototype','constructor'].includes(String(key))||value===null||typeof value!=='object'||!Object.hasOwn(value,key)){value=undefined;break;}value=(value as Row)[key];}
   if(value===undefined||value===null){pending.push('SOURCE_CLAIM_UNKNOWN_OBSERVATION');continue;}
   if(typeof value==='object'){pending.push('SOURCE_CLAIM_UNSUPPORTED_OBSERVATION');continue;}
   if(value!==claim.value)faults.push('SOURCE_CLAIM_VALUE_CONFLICT');
  }
  const coverageDigest=digest({candidateId:claimSet.candidateId,snapshotDigest:claimSet.snapshotDigest,claims:claimSet.claims.map(({value,...identity})=>identity).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
  return {...base,coverageDigest,status:faults.length?'FAILED':pending.length?'UNVERIFIED':'MATCHED',checked:claimSet.claims.length,faults:[...new Set(faults)],pending:[...new Set(pending)]};
 }catch(error){return {...base,status:'FAILED',checked:0,faults:[error instanceof Error&&/^SOURCE_CLAIM_[A-Z_]+$/.test(error.message)?error.message:'SOURCE_CLAIM_SCHEMA_INVALID'],pending};}
}
