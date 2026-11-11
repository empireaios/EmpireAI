import {digest,immutable} from './store.mjs';
const types=['email.delivered','email.bounced','email.failed','email.delivery_delayed'];
const phases=['fault','escalation','recovery'];
const validDate=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
function validateReceipt(r,key,prefix){
 if(!r||typeof r.eventId!=='string'||!r.eventId||typeof r.providerId!=='string'||!r.providerId.trim()||r.providerId.length>200||!types.includes(r.type)||!validDate(r.createdAt)||!validDate(r.firstObservedAt)||! /^[a-f0-9]{64}$/.test(r.rawHash)||key!==prefix+digest(r.eventId))throw Error('Invalid retained receipt');
}
// Invoked before dispatch admission and periodically by an authorised controller.
// This operation never dispatches, recreates results, signs provider claims or changes receipts.
export async function recoverReceipts(campaign,{maxEvents=128,maxDurationMs=30000,clock=Date.now}={}){
 if(!Number.isSafeInteger(maxDurationMs)||maxDurationMs<1||maxDurationMs>60000)throw Error('Invalid recovery duration');
 const started=clock();const bounded=async promise=>{if(clock()-started>=maxDurationMs)throw Error('Recovery duration exceeded');const result=await promise();if(clock()-started>=maxDurationMs)throw Error('Recovery duration exceeded');return result;};
 if(!Number.isSafeInteger(maxEvents)||maxEvents<1||maxEvents>999)throw Error('Invalid recovery bound');
 const prefix=campaign.path('events/');
 const keys=await bounded(()=>campaign.store.list(prefix,maxEvents));
 if(!Array.isArray(keys)||keys.length>maxEvents||new Set(keys).size!==keys.length)throw Error('Evidence scan exceeds bound');
 const receipts=[];
 for(const key of keys){const r=await bounded(()=>campaign.store.get(key));validateReceipt(r,key,prefix);receipts.push(r);}
 const providers=new Map();
 for(const phase of phases){
  const result=await bounded(()=>campaign.get(phase+'/result'));
  if(result?.status==='PROVIDER_ACCEPTED'){
   if(typeof result.providerId!=='string'||!result.providerId.trim()||providers.has(result.providerId))throw Error('Ambiguous retained result');
   providers.set(result.providerId,phase);
  }else if(result&&result.status!=='UNKNOWN')throw Error('Invalid retained result');
 }
 // Validate ALL input identities before attempting any repair. Existing immutable index wins.
 receipts.sort((a,b)=>Date.parse(a.firstObservedAt)-Date.parse(b.firstObservedAt)||a.eventId.localeCompare(b.eventId));
 const groups=new Map();
 for(const r of receipts){const key='provider-events/'+digest({providerId:r.providerId,type:r.type});if(!groups.has(key))groups.set(key,r);}
 for(const [key,r]of groups){
  const pointer=await bounded(()=>campaign.get(key));
  if(pointer){const old=await bounded(()=>campaign.get('events/'+digest(pointer.eventId)));validateReceipt(old,campaign.path('events/')+digest(pointer.eventId),prefix);if(old.providerId!==r.providerId||old.type!==r.type)throw Error('Retained index conflict');}
 }
 for(const [key,r]of groups){
  if(!await bounded(()=>campaign.store.create(campaign.path(key),{eventId:r.eventId}))){
   const pointer=await bounded(()=>campaign.get(key)),old=pointer&&await bounded(()=>campaign.get('events/'+digest(pointer.eventId)));
   validateReceipt(old,campaign.path('events/')+digest(pointer?.eventId),prefix);
   if(old.providerId!==r.providerId||old.type!==r.type)throw Error('Concurrent index conflict');
  }
 }
 let correlated=0,orphans=0;
 for(const r of receipts){
  const phase=providers.get(r.providerId);
  if(!phase){orphans++;continue;}
  await bounded(()=>immutable(campaign.store,campaign.path('correlations/'+digest(r.eventId)),{eventId:r.eventId,providerId:r.providerId,phase,receiptHash:digest(r)}));correlated++;
 }
 return {scanned:receipts.length,correlated,orphans,sendAttempts:0,receiptDigest:digest(receipts),listedReceiptsProcessed:true};
}
