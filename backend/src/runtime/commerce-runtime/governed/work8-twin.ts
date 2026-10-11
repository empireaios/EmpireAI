import {z} from 'zod';
import {digest,type GovernedCommerceStore} from './store.js';
import type {CommerceState} from './engine.js';
const key=z.string().min(1).max(100).regex(/^[A-Za-z0-9_.:-]+$/);
const principal=z.object({workspace:key,owner:key}).strict();
const request=z.object({id:key,sessionId:key,expectedVersion:z.number().int().nonnegative(),action:z.enum(['CREATE','RESUME','PAUSE','ARCHIVE'])}).strict();
type Principal=z.infer<typeof principal>;
type TwinEvent={schema:'WORK8_TWIN_V1';workspace:string;owner:string;sessionId:string;twinWorkspace:string;id:string;version:number;action:z.infer<typeof request>['action'];status:'PAUSED'|'ACTIVE'|'ARCHIVED';at:number;previous:string;requestDigest:string;digest:string;classification:'SIMULATED_OPERATIONS';externalEffects:0};
/** Lifecycle only. Commerce, tasks and finance remain in their existing canonical tables. */
export class Work8TwinSessions {
 constructor(readonly store:GovernedCommerceStore,readonly now:()=>number=Date.now){
  store.db.exec(`CREATE TABLE IF NOT EXISTS work8_twin_events(workspace TEXT NOT NULL,session TEXT NOT NULL,version INTEGER NOT NULL,request TEXT NOT NULL,record TEXT NOT NULL,PRIMARY KEY(workspace,session,version),UNIQUE(workspace,request));
   CREATE TRIGGER IF NOT EXISTS immutable_twin_update BEFORE UPDATE ON work8_twin_events BEGIN SELECT RAISE(ABORT,'IMMUTABLE_TWIN_EVENT');END;
   CREATE TRIGGER IF NOT EXISTS immutable_twin_delete BEFORE DELETE ON work8_twin_events BEGIN SELECT RAISE(ABORT,'IMMUTABLE_TWIN_EVENT');END;`);
 }
 private history(p:Principal,sessionId:string):TwinEvent[]{
  const rows=this.store.db.prepare('SELECT record FROM work8_twin_events WHERE workspace=? AND session=? ORDER BY version LIMIT 1001').all(p.workspace,sessionId);
  if(rows.length>1000)throw Error('TWIN_HISTORY_BOUND');
  let previous='',version=0;
  return rows.map(row=>{const e=JSON.parse(String(row.record)) as TwinEvent;const {digest:hash,...body}=e;
   if(e.workspace!==p.workspace||e.sessionId!==sessionId||e.owner!==p.owner)throw Error('TWIN_OWNER_SCOPE_DENIED');
   if(e.schema!=='WORK8_TWIN_V1'||e.previous!==previous||e.version!==++version||digest(body)!==hash||e.twinWorkspace!==this.namespace(p,sessionId)||e.classification!=='SIMULATED_OPERATIONS'||e.externalEffects!==0)throw Error('TWIN_HISTORY_UNVERIFIED');
   previous=hash;return e;});
 }
 private namespace(p:Principal,sessionId:string){return 'twin_'+digest({workspace:p.workspace,owner:p.owner,sessionId}).slice(0,48);}
 read(rawPrincipal:unknown,sessionId:string){const p=principal.parse(rawPrincipal);key.parse(sessionId);const e=this.history(p,sessionId).at(-1);if(!e)throw Error('TWIN_NOT_FOUND');return e;}
 transition(rawPrincipal:unknown,rawRequest:unknown){
  const p=principal.parse(rawPrincipal),r=request.parse(rawRequest),requestDigest=digest({p,r});
  return this.store.transaction(()=>{
   const old=this.store.db.prepare('SELECT record FROM work8_twin_events WHERE workspace=? AND request=?').get(p.workspace,r.id);
   if(old){const e=JSON.parse(String(old.record)) as TwinEvent;const history=this.history(p,e.sessionId);if(e.requestDigest!==requestDigest||!history.some(x=>x.digest===e.digest))throw Error('TWIN_IDEMPOTENCY_CONFLICT');return e;}
   const history=this.history(p,r.sessionId),last=history.at(-1);
   if(history.length>=1000)throw Error('TWIN_HISTORY_BOUND');
   if((last?.version??0)!==r.expectedVersion)throw Error('TWIN_VERSION_CONFLICT');
   if(!last&&r.action!=='CREATE'||last&&r.action==='CREATE'||last?.status==='ARCHIVED')throw Error('TWIN_TRANSITION_DENIED');
   if(r.action==='RESUME'&&last?.status!=='PAUSED'||r.action==='PAUSE'&&last?.status!=='ACTIVE')throw Error('TWIN_TRANSITION_DENIED');
   const twinWorkspace=this.namespace(p,r.sessionId);
   if(!last){const occupied=this.store.db.prepare('SELECT 1 FROM commerce_runtime_receipts WHERE workspace=? LIMIT 1').get(twinWorkspace)||this.store.db.prepare('SELECT 1 FROM commerce_runtime_tasks WHERE workspace=? LIMIT 1').get(twinWorkspace);if(occupied)throw Error('TWIN_NAMESPACE_OCCUPIED');}
   const body={schema:'WORK8_TWIN_V1' as const,...p,sessionId:r.sessionId,twinWorkspace,id:r.id,version:r.expectedVersion+1,action:r.action,status:r.action==='RESUME'?'ACTIVE' as const:r.action==='ARCHIVE'?'ARCHIVED' as const:'PAUSED' as const,at:this.now(),previous:last?.digest??'',requestDigest,classification:'SIMULATED_OPERATIONS' as const,externalEffects:0 as const};
   const event={...body,digest:digest(body)};this.store.db.prepare('INSERT INTO work8_twin_events VALUES(?,?,?,?,?)').run(p.workspace,r.sessionId,event.version,r.id,JSON.stringify(event));return event;
  });
 }
 /** Call inside the same canonical store transaction as any twin command or worker step. */
 run<T>(rawPrincipal:unknown,sessionId:string,expectedVersion:number,operation:(twinWorkspace:string)=>T):T{
  return this.store.transaction(()=>{const e=this.read(rawPrincipal,sessionId);if(e.version!==expectedVersion||e.status!=='ACTIVE')throw Error('TWIN_INACTIVE_OR_STALE');return operation(e.twinWorkspace);});
 }
 /** One bounded projection for all views; no copied orders, financial ledger or invented metrics. */
 snapshot(rawPrincipal:unknown,sessionId:string,after='',limit=50){
  if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('TWIN_PAGE_BOUND');
  return this.store.transaction(()=>{const session=this.read(rawPrincipal,sessionId);
   const ids=this.store.db.prepare('SELECT DISTINCT mission FROM commerce_runtime_receipts WHERE workspace=? AND mission>? ORDER BY mission LIMIT ?').all(session.twinWorkspace,after,limit+1).map(x=>String(x.mission));
   const page=ids.slice(0,limit).map(id=>{const r=this.store.history(session.twinWorkspace,id).at(-1)!;const s=r.state as unknown as CommerceState;
    if(r.classification!=='SYNTHETIC'||r.externalEffects!==0||s.externalEffects!==0||s.paidInference!==0||Object.values(s.orders).some(o=>o.order.workspaceId!==session.twinWorkspace||o.order.integrationMode!=='SANDBOX'))throw Error('TWIN_RECORD_ISOLATION_FAILED');
    return {missionId:id,receiptDigest:r.digest,version:r.version,productId:s.candidate.productId,variantId:s.candidate.offer.variantId,listing:s.listing??null,publication:s.publicationIntent??null,orders:s.orders,financeReference:{workspace:session.twinWorkspace,missionId:id,sourceReceiptDigest:r.digest},sourceClassification:s.candidate.offer.provenance.classification};});
   return {schema:'WORK8_TWIN_PROJECTION_V1',label:'DIGITAL TWIN — SIMULATED OPERATIONS',session,records:page,next:ids.length>limit?ids[limit-1]:null,coverage:'BOUNDED_PAGE',actualCashMovement:0,liveCommerce:'LOCKED',birth:'NOT_BORN'};
  });
 }
}
