import {digest,type Evidence} from './model.js';
import type {IntelligenceStore,Row} from './store.js';
/** One downstream candidate per catalog cycle, at most one variant. No recursive open-ended crawl. */
export function discoverNext(store:IntelligenceStore,w:string,e:Evidence){
 if(e.authenticity!=='LIVE_PROVIDER')return;
 const response=e.facts.response as Row|undefined;
 if(e.capabilityId==='amazon.catalog'){
  const items=Array.isArray(response?.items)?response.items:[];
  const item=items.find((x:Row)=>typeof x.asin==='string'&&/^[A-Z0-9]{10}$/.test(x.asin));if(!item)return;
  const subject={...e.subject,id:item.asin,query:undefined};const facts={response:item,interpretation:'Catalog rank proxy; not demand or profit'};
  const id='ev_'+digest([e.id,item.asin]).slice(0,40);store.evidence(w,{...e,id,subject,facts,digest:digest(facts),lineage:[...e.lineage,e.id]});
  store.enqueue(w,'DISCOVERY:'+e.jobId,{id:'follow_'+digest([e.id,'offers']).slice(0,36),objective:'Inspect offers for bounded catalog candidate',capabilities:['amazon.offers'],subject,requestLimit:3,evidenceRefs:[id]});
 }else if(e.capabilityId==='cj.catalog'){
  const items=Array.isArray(response)?response:Array.isArray(response?.list)?response.list:[];const item=items.find((x:Row)=>typeof x.pid==='string');if(!item)return;
  store.enqueue(w,'DISCOVERY:'+e.jobId,{id:'follow_'+digest([e.id,'detail']).slice(0,36),objective:'Inspect one sourcing candidate independently of market demand',capabilities:['cj.detail'],subject:{...e.subject,id:item.pid,query:undefined},requestLimit:3,evidenceRefs:[e.id]});
 }else if(e.capabilityId==='cj.detail'){
  const variants=Array.isArray(response?.variants)?response.variants:[];const item=variants.find((x:Row)=>typeof x.vid==='string');if(!item)return;
  store.enqueue(w,'DISCOVERY:'+e.jobId,{id:'follow_'+digest([e.id,'logistics']).slice(0,36),objective:'Verify variant stock and freight operands without creating any order',capabilities:['cj.stock','cj.freight'],subject:{...e.subject,variant:item.vid,destination:e.subject.destination??'US'},requestLimit:4,evidenceRefs:[e.id]});
 }
}
