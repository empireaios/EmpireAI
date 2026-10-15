export type ProductReference={sessionId?:string;missionId:string;receiptDigest:string}|{kind:'SOURCE_DOSSIER';candidateId:string;contextDigest:string};
export type AttachedProduct={reference:ProductReference;label:string};
export function referenceIdentity(r:ProductReference){return 'kind' in r?'source:'+r.candidateId:'mission:'+JSON.stringify([r.sessionId??null,r.missionId]);}
export function referenceScope(r:ProductReference){return 'kind' in r?'SOURCE_DOSSIER':r.sessionId??'LIVE_REFERENCE';}
export function validProductReference(value:unknown):value is ProductReference {
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const r=value as Record<string,unknown>;
 if(r.kind==='SOURCE_DOSSIER')return Object.keys(r).every(k=>['kind','candidateId','contextDigest'].includes(k))&&typeof r.candidateId==='string'&&r.candidateId.length>0&&r.candidateId.length<=160&&typeof r.contextDigest==='string'&&/^[a-f0-9]{64}$/.test(r.contextDigest);
 return Object.keys(r).every(k=>['sessionId','missionId','receiptDigest'].includes(k))&&typeof r.missionId==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(r.missionId)&&typeof r.receiptDigest==='string'&&/^[a-f0-9]{64}$/.test(r.receiptDigest)&&(r.sessionId===undefined||typeof r.sessionId==='string'&&/^[A-Za-z0-9_.:-]{1,100}$/.test(r.sessionId));
}
async function read(reference:ProductReference|{kind:'SOURCE_DOSSIER';candidateId:string}):Promise<AttachedProduct>{
 const query=new URLSearchParams({...reference});
 const response=await fetch('/api/owner/commerce/twin/context?'+query,{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw Error('This product context is unavailable or has changed. Reopen its current record.');
 const value=await response.json();
 if(!validProductReference(value.reference)||typeof value.label!=='string'||!value.label.trim()||value.grantsAuthority!==false)throw Error('Product context could not be verified.');
 for(const [key,expected] of Object.entries(reference))if((value.reference as Record<string,unknown>)[key]!==expected)throw Error('Product context reference changed.');
 if(Object.keys(value.reference).length!==Object.keys(reference).length+('kind' in reference&&!('contextDigest' in reference)?1:0))throw Error('Unexpected product reference fields.');
 return {reference:value.reference,label:value.label.slice(0,180)};
}
export async function readProductContext(reference:ProductReference):Promise<AttachedProduct>{
 if(!validProductReference(reference))throw Error('Invalid product reference. Reopen the product.');
 return read(reference);
}
export async function readSourceProductContext(candidateId:string):Promise<AttachedProduct>{
 if(!candidateId||candidateId.length>160)throw Error('Source candidate reference unavailable.');
 return read({kind:'SOURCE_DOSSIER',candidateId});
}
export function selectProduct(current:AttachedProduct[],next:AttachedProduct,compare=false):AttachedProduct[]{
 if(!compare)return [next];
 if(current.some(p=>referenceScope(p.reference)!==referenceScope(next.reference)))throw Error('Compare products from the same workspace session.');
 const rest=current.filter(p=>referenceIdentity(p.reference)!==referenceIdentity(next.reference));
 if(rest.length>=4)throw Error('Compare at most four products.');
 return [...rest,next];
}
