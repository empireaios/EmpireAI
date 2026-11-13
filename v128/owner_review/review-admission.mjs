import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {validPortfolioQuery} from './host/portfolio-query.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const fail=code=>{throw new Error('OWNER_REVIEW_'+code);};
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join('|')===[...keys].sort().join('|');
const safeEqual=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));

/** One authenticated owner choice. This proves native principal and input
 * binding; the independent owner handoff must establish the personal actor. */
export function createReviewAdmission({origin,expiresAtMs,baseline,now=Date.now,random=randomBytes}) {
 const parsed=new URL(origin);
 if(parsed.protocol!=='https:'||parsed.origin!==origin||parsed.username||parsed.password)fail('ORIGIN_CONFIG');
 if(!Number.isSafeInteger(expiresAtMs)||expiresAtMs<=now()||expiresAtMs-now()>1200000)fail('EXPIRY_CONFIG');
 let attempted=false,sealed=false;const nonces=new Map();
 function active(){if(sealed||attempted||now()>=expiresAtMs)fail('CLOSED');}
 function principal(user,sessionToken){
  if(!user||user.id!==baseline.owner||user.workspaceId!==baseline.workspace||user.role!=='founder'||typeof user.email!=='string'||sha(user.email.trim().toLowerCase()).slice(0,16)!==baseline.owner.slice(4)||typeof sessionToken!=='string'||!/^[a-f0-9]{64}$/.test(sessionToken))fail('PRINCIPAL');
  return sha(sessionToken);
 }
 function source(view){
  if(!view||view.candidateId!==baseline.candidateId||view.candidateDigest!==baseline.candidateDigest||view.version!==2||view.proposal?.version!==2||view.proposal?.batchDigest!==baseline.batchDigest||view.proposal?.digest!==baseline.proposalEventDigest||view.ownerApproval!==false||!Array.isArray(view.current?.assets)||view.current.assets.length!==0)fail('BASELINE_CHANGED');
 }
 function headers(value){if(value.origin!==origin||value['x-empire-owner-review-host']!==parsed.host||value['sec-fetch-site']!=='same-origin')fail('ORIGIN');}
 return {
  issue({user,sessionToken,view,requestHeaders}){
   active();headers(requestHeaders);const session=principal(user,sessionToken);source(view);
   for(const [key,item]of nonces)if(item.expires<=now()||item.session===session)nonces.delete(key);
   if(nonces.size>=4)fail('NONCE_BOUND');
   const nonce=random(32).toString('base64url'),expires=Math.min(expiresAtMs,now()+120000);
   nonces.set(sha(nonce),{session,expires});
   return {nonce,expiresAtMs:expires,expectedVersion:2,candidateId:baseline.candidateId,candidateDigest:baseline.candidateDigest,batchDigest:baseline.batchDigest};
  },
  consume({user,sessionToken,view,requestHeaders,body}){
   active();headers(requestHeaders);const session=principal(user,sessionToken);source(view);
   if(!exact(body,['action','media'])||body.action!=='connector_media')fail('COMMAND');
   const r=body.media,action=r?.action;
   if(!['ACKNOWLEDGE_REVIEW','APPROVE_INTERNAL','REJECT'].includes(action))fail('ACTION');
   const fields=['id','reference','expectedVersion','action','batchDigest'];
   if(action==='APPROVE_INTERNAL'&&Object.hasOwn(r,'assetIds'))fields.push('assetIds');
   if(!exact(r,fields)||!exact(r.reference,['candidateId','candidateDigest'])||r.reference.candidateId!==baseline.candidateId||r.reference.candidateDigest!==baseline.candidateDigest||r.expectedVersion!==2||r.batchDigest!==baseline.batchDigest||typeof r.id!=='string'||!/^[A-Za-z0-9_.:-]{1,160}$/.test(r.id))fail('VERSION_BOUND_INPUT');
   if(Object.hasOwn(r,'assetIds')&&(!Array.isArray(r.assetIds)||r.assetIds.length!==1||r.assetIds[0]!==baseline.revisedAssetId))fail('SELECTION');
   const nonce=requestHeaders['x-empire-review-nonce'];
   if(typeof nonce!=='string'||!/^[A-Za-z0-9_-]{32,128}$/.test(nonce))fail('NONCE');
   const saved=nonces.get(sha(nonce));if(!saved||saved.expires<=now()||!safeEqual(saved.session,session))fail('NONCE');
   // Before the native write: any uncertain result is terminal, never retried.
   attempted=true;nonces.clear();
   return {schema:'A09_AUTHENTICATED_OWNER_INPUT_BINDING_V1',owner:baseline.owner,workspace:baseline.workspace,candidateId:baseline.candidateId,candidateDigest:baseline.candidateDigest,expectedVersion:2,batchDigest:baseline.batchDigest,action,requestId:r.id,requestSHA256:sha(JSON.stringify(body)),sessionSHA256:session,atMs:now(),nativeOwnerPrincipalAuthenticated:true,personalActorAttribution:'REQUIRES_INDEPENDENT_OWNER_HANDOFF_OBSERVATION',approvalClaimed:false};
  },
  close(){sealed=true;nonces.clear();},
  get attempted(){return attempted;},
  get closed(){return sealed||attempted||now()>=expiresAtMs;},
 };
}

export function allowedReviewRoute(method,url){
 if(typeof url!=='string'||url.length>4096||url.includes('\\')||url.includes('//')||url.includes('#'))return false;
 const split=url.indexOf('?'),pathname=split<0?url:url.slice(0,split),search=split<0?'':url.slice(split);
 if(pathname.includes('%'))return false;
 if(method==='GET'&&pathname==='/api/owner/commerce/portfolio')return validPortfolioQuery(search);
 if(search)return false;
 if(method==='GET')return ['/auth/me','/api/owner/commerce/portfolio','/api/owner/commerce/review-session'].includes(pathname);
 return method==='POST'&&['/auth/login','/auth/logout','/api/owner/commerce'].includes(pathname);
}
