import {digest,type Receipt,type GovernedCommerceStore} from '../runtime/commerce-runtime/governed/store.js';
import type {CommerceState} from '../runtime/commerce-runtime/governed/engine.js';
type Scan={after:string;startedAt:number;blocked:boolean;completedAt:number|null;watermark:number};
type Probe={id:string;capability:string;classification:string;severity:string;status:string;runbookId:null;summary:string;evidence:{observedAt:number;reason?:string;outcome?:string;quotedExposure?:{currency:string;amount:number;basis:string};adverseTracking?:Array<{eventId:string;status:string}>;[key:string]:unknown}};
/** Bounded observations with a durable derived scan cursor. No provider reads,
 * command execution, retry, stock release, or new recovery authority. */
export function makeWork8FulfilmentProbes({store,now=Date.now,missionBudget=256,maxHistory=512,maxOrders=32,maxHistoryBytes=1048576}:{store:GovernedCommerceStore;now?:()=>number;missionBudget?:number;maxHistory?:number;maxOrders?:number;maxHistoryBytes?:number}){
 for(const [n,ceiling] of [[missionBudget,256],[maxHistory,2048],[maxOrders,128],[maxHistoryBytes,4194304]] as const)if(!Number.isSafeInteger(n)||n<=0||n>ceiling)throw Error('FULFILMENT_SCAN_BOUND');
 store.db.exec('CREATE TABLE IF NOT EXISTS work8_fulfilment_scan(workspace TEXT PRIMARY KEY,record TEXT NOT NULL)');
 return {probes(workspace:string):Probe[]{return store.transaction(()=>{
  const observedAt=now(),old=store.db.prepare('SELECT record FROM work8_fulfilment_scan WHERE workspace=?').get(workspace);
  const scan:Scan=old?JSON.parse(String(old.record)):{after:'',startedAt:observedAt,blocked:false,completedAt:null,watermark:0};
  if(typeof scan.after!=='string'||!Number.isSafeInteger(scan.startedAt)||typeof scan.blocked!=='boolean')throw Error('FULFILMENT_SCAN_CORRUPT');
  const watermark=Number(store.db.prepare('SELECT rowid FROM commerce_runtime_receipts WHERE workspace=? ORDER BY rowid DESC LIMIT 1').get(workspace)?.rowid??0);
  if(!scan.after){scan.startedAt=observedAt;scan.blocked=false;scan.watermark=watermark;}
  const missions=store.db.prepare('SELECT DISTINCT mission FROM commerce_runtime_receipts WHERE workspace=? AND mission>? ORDER BY mission LIMIT ?').all(workspace,scan.after,missionBudget+1);
  const probes:Probe[]=[],blockedMissions:Array<{missionId:string;reason:string}>=[];
  for(const row of missions.slice(0,missionBudget)){
   const missionId=String(row.mission);scan.after=missionId;
   const sizes=store.db.prepare('SELECT length(CAST(record AS BLOB)) bytes FROM commerce_runtime_receipts WHERE workspace=? AND mission=? ORDER BY version LIMIT ?').all(workspace,missionId,maxHistory+1);
   if(sizes.length>maxHistory||sizes.reduce((n,r)=>n+Number(r.bytes),0)>maxHistoryBytes){scan.blocked=true;blockedMissions.push({missionId,reason:'HISTORY_SCAN_BOUND_EXCEEDED'});continue;}
   const history=store.history(workspace,missionId),latest=history.at(-1)!;
   const state=latest.state as unknown as CommerceState;
   if(Object.keys(state.orders).length>maxOrders){scan.blocked=true;blockedMissions.push({missionId,reason:'ORDER_SCAN_BOUND_EXCEEDED'});continue;}
   const historyDigest=digest(history),intakes=new Map<string,Receipt>(),tracking=new Map<string,Array<Extract<Receipt['command'],{type:'tracking'}>['event']>>();
   for(const receipt of history){const c=receipt.command;if(c.type==='intake')intakes.set(c.order.orderId,receipt);if(c.type==='tracking'){const events=tracking.get(c.event.orderId)??[];events.push(c.event);tracking.set(c.event.orderId,events);}}
   probes.push(...Object.entries(state.orders).map(([orderId,order])=>{
    const intake=intakes.get(orderId);
    if(!intake||intake.command.type!=='intake')throw Error('FULFILMENT_INTAKE_MISSING');
    const createdAt=intake.command.order.createdAt;
    if(createdAt!==order.order.createdAt)throw Error('FULFILMENT_CREATED_AT_DRIFT');
    const deadline=Date.parse(createdAt)+state.candidate.offer.leadDays*86400000;
    if(!Number.isFinite(deadline))throw Error('FULFILMENT_DEADLINE_INVALID');
    const events=tracking.get(orderId)??[];
    const adverse=events.filter(e=>['DELAYED','LOST','DAMAGED'].includes(e.status));
    const terminal=['DELIVERED','CANCELLED','REJECTED'].includes(order.outcome);
    const uncertain=['UNKNOWN','RECONCILIATION_REQUIRED'].includes(order.outcome);
    const breach=!terminal&&['ACCEPTED','PARTIAL','SHIPPED'].includes(order.outcome)&&observedAt>deadline;
    const classification=uncertain?'SUPPLIER_RECONCILIATION_REQUIRED':breach?(events.length===0?'MISSING_TRACKING_OVERDUE':adverse.length?'ADVERSE_TRACKING_OVERDUE':'DELIVERY_OVERDUE'):'FULFILMENT_WINDOW_VERIFIED';
    return {id:'work8-fulfilment:'+digest({workspace,missionId,orderId}),capability:'commerce-fulfilment',classification:'SIMULATED_FULFILMENT_WINDOW',severity:'HIGH',status:(uncertain?'BLOCKED':breach?'FAILED':'HEALTHY') as 'BLOCKED'|'FAILED'|'HEALTHY',runbookId:null,
     summary:uncertain?'Supplier outcome requires reconciliation; no autonomous retry is authorised.':breach?'Simulated fulfilment exceeded its assumed delivery window; owner review required.':'Fresh canonical history shows terminal fulfilment or no breached simulated delivery window.',
     evidence:{reason:classification,observedAt,workspace,missionId,orderId,outcome:order.outcome,receiptDigest:latest.digest,historyDigest,createdAt,assumedDeadline:new Date(deadline).toISOString(),deadlineAssumption:'SIMULATED_ORDER_CREATED_AT_PLUS_QUOTED_LEAD_DAYS_NOT_PROVIDER_PROMISE',leadDays:state.candidate.offer.leadDays,trackingEventCount:events.length,trackingEventsDigest:digest(events),trackingEventIds:events.slice(-10).map(e=>e.eventId),adverseTrackingCount:adverse.length,adverseTracking:adverse.slice(-10).map(e=>({eventId:e.eventId,status:e.status})),quotedExposure:{currency:state.candidate.offer.currency,amount:order.order.items.reduce((n,item)=>n+item.quantity*state.candidate.offer.price,0)+state.candidate.offer.freight,basis:'SIMULATED_QUOTED_PRODUCT_COST_PLUS_ONE_QUOTED_FREIGHT_NOT_ACTUAL_LIABILITY'},classification:'SYNTHETIC',externalEffects:0}};
   }));
  }
  const complete=missions.length<=missionBudget,sourceChanged=scan.watermark!==watermark,stale=observedAt-scan.startedAt>180000||observedAt<scan.startedAt;
  if(complete){scan.after='';scan.completedAt=observedAt;}
  store.db.prepare('INSERT INTO work8_fulfilment_scan VALUES(?,?) ON CONFLICT(workspace) DO UPDATE SET record=excluded.record').run(workspace,JSON.stringify(scan));
  probes.push({id:'work8-fulfilment-coverage',capability:'commerce-fulfilment-coverage',classification:'BOUNDED_FULFILMENT_SCAN',severity:'HIGH',runbookId:null,status:scan.blocked?'BLOCKED':stale?'STALE':complete&&!sourceChanged?'HEALTHY':'NOT_CHECKED',summary:scan.blocked?'Some canonical missions exceed bounded verification limits; coverage is incomplete.':stale?'Fulfilment sweep exceeded freshness window; omitted orders are not verified healthy.':sourceChanged?'NOT_COMPLETE: canonical receipts changed during this sweep; fresh coverage requires another sweep.':complete?'A fresh bounded sweep completed; order outcomes are reported separately.':'NOT_COMPLETE: bounded fulfilment sweep will resume; skipped orders are not verified healthy.',evidence:{observedAt,startedAt:scan.startedAt,completedAt:scan.completedAt,complete:complete&&!sourceChanged,sweepComplete:complete,sourceChanged,watermark,after:scan.after,missionBudget,maxHistory,maxOrders,maxHistoryBytes,examinedMissions:Math.min(missions.length,missionBudget),blockedMissions,externalEffects:0}});
  return probes;
 });}};
}
