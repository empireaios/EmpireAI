import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GovernedCommerceStore,digest} from './store.js';
import {GovernedCommerceEngine,type CommerceState} from './engine.js';
import {CommerceWorker,type Task} from './worker.js';
import {acceptanceScenario} from './scenario.js';
import {projectWork8Finance,type Work8FinanceEvent} from './work8-finance.js';
const check=(condition:boolean,code:string)=>{if(!condition)throw Error('WORK8_EXAM_'+code);};
const modes=['POSITIVE','LOSS','REFUND','PAYOUT_DELAY'] as const;
/** Bounded offline examination. Creates only its own temporary canonical store, never production data. */
export function runWork8OperatingExams(seed=8,count=4){
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(count)||count<4||count>24)throw Error('WORK8_EXAM_INVALID_BOUNDS');
 const directory=mkdtempSync(join(tmpdir(),'empire-work8-exam-'));const filename=join(directory,'commerce.sqlite');
 let now=Date.parse('2026-10-11T00:00:00.000Z');let store=new GovernedCommerceStore(filename);let engine=new GovernedCommerceEngine(store,()=>now);let worker=new CommerceWorker(engine);
 const reports=[];
 try{for(let index=0;index<count;index++){
  now=Date.parse('2026-10-11T00:00:00.000Z')+index*86400000;const mode=modes[index%4]!;const suffix=seed+'-'+index;const workspace='work8-exam-'+suffix;const owner='synthetic-owner';const taskId='exam-'+suffix;
  const s=acceptanceScenario(workspace,owner,now);const quantity=1+((seed+index)%2);const price=8+((seed+index)%5);
  s.candidate.title='Synthetic seeded organiser '+suffix;s.candidate.offer.price=price;s.candidate.economics.productCost=price;s.candidate.economics.sellingPrice=45+(seed%7);s.candidate.productId='product-'+suffix;s.candidate.offer.productId=s.candidate.productId;s.candidate.offer.sku='sku-'+suffix;s.candidate.economics.productId=s.candidate.productId;
  s.listing.productId=s.candidate.productId;s.listing.title=s.candidate.title;s.listing.variants[0]!.sku=s.candidate.offer.sku;
  const approvedDigest=digest({candidate:s.candidate,listing:s.listing});
  const steps:Task['steps']=[{actor:s.actors.PROPOSER!,command:{type:'research',candidate:s.candidate}},{actor:s.actors.PROPOSER!,command:{type:'listing',listing:s.listing}},{actor:s.actors.REVIEWER!,command:{type:'review',digest:approvedDigest,decision:'APPROVE',reason:'Synthetic exam independent policy review'}},{actor:s.actors.OWNER!,command:{type:'approve',digest:approvedDigest,expiresAt:new Date(now+3600000).toISOString(),maxExposure:300}}];
  for(let oi=0;oi<2;oi++){
   const order=structuredClone(s.order);order.orderId='order-'+suffix+'-'+oi;order.items[0]!.quantity=quantity;order.items[0]!.unitCost=price;order.items[0]!.supplierProductId=s.candidate.productId;order.items[0]!.supplierSku=s.candidate.offer.sku;order.estimatedCost=quantity*price;
   const actor=s.actors.EXECUTOR!;const providerId='provider-'+order.orderId;const track={orderId:order.orderId,shipmentId:'shipment-'+order.orderId,providerId,carrier:'synthetic',tracking:'tracking-'+order.orderId,quantity,occurredAt:new Date(now).toISOString()};
   steps.push({actor,command:{type:'intake',order,paymentEvidence:'evidence-PAYMENT'}},{actor,command:{type:'prepare',orderId:order.orderId,offer:s.candidate.offer}},{actor,command:{type:'intercept',orderId:order.orderId,result:'ACCEPTED',acceptedQuantity:quantity,providerId}},{actor,command:{type:'tracking',event:{...track,eventId:'shipped-'+order.orderId,status:'SHIPPED'}}},{actor,command:{type:'tracking',event:{...track,eventId:'delivered-'+order.orderId,status:'DELIVERED',proof:'synthetic-proof'}}});
   if(mode==='REFUND')steps.push({actor,command:{type:'remedy',orderId:order.orderId,caseId:'refund-'+order.orderId,kind:'REFUND',amount:5,quantity:1,reason:'Seeded synthetic refund examination'}});
  }
  let task=worker.enqueue(workspace,owner,taskId);
  // Fixture preparation occurs before its first command; existing canonical task table only.
  task.steps=steps;task.maxSteps=steps.length;
  store.transaction(()=>store.db.prepare('UPDATE commerce_runtime_tasks SET record=? WHERE workspace=? AND id=? AND version=0').run(JSON.stringify(task),workspace,taskId));
  task=worker.runBounded(workspace,taskId,4);check(task.cursor===4,'INITIAL_APPROVAL');
  const step=task.steps[task.cursor]!;
  engine.execute(step.actor,{id:digest({task:taskId,step:task.cursor}),missionId:task.mission,expectedVersion:task.cursor,command:step.command});
  const prefix=store.history(workspace,task.mission).map(r=>r.digest);store.close();store=new GovernedCommerceStore(filename);engine=new GovernedCommerceEngine(store,()=>now);worker=new CommerceWorker(engine);
  task=worker.tick(workspace,taskId,task.fence);check(store.history(workspace,task.mission).length===prefix.length,'CRASH_REPLAY_DUPLICATED_RECEIPT');
  for(let round=0;round<8&&task.status!=='COMPLETE'&&task.status!=='BLOCKED';round++)task=worker.runBounded(workspace,taskId,4);
  check(task.status==='COMPLETE','TASK_'+(task.error??task.status));const receipts=store.history(workspace,task.mission);check(prefix.every((d,i)=>receipts[i]?.digest===d),'IMMUTABLE_PREFIX');check(receipts.length===steps.length,'RECEIPT_COUNT');
  const missionId=task.mission;const source=receipts.at(-1)!;const state=source.state as unknown as CommerceState;
  check(Object.keys(state.orders).length===2,'ORDER_COUNT');for(const o of Object.values(state.orders))check(o.outcome==='DELIVERED'&&o.accepted===quantity&&o.shipped===quantity&&o.delivered===quantity&&Object.values(o.shipments).every(sh=>sh.delivered),'INDEPENDENT_DELIVERY');
  check(receipts.every(r=>r.externalEffects===0)&&state.externalEffects===0&&state.paidInference===0,'NO_EFFECTS');
  const events:Work8FinanceEvent[]=[];let sequence=0;const expected:Record<string,number>={};
  for(const [orderId,o] of Object.entries(state.orders)){
   const sale=Math.round(s.candidate.economics.sellingPrice*quantity*100);const cogs=price*quantity*100;const freight=300*quantity;const fee=mode==='LOSS'?sale+100:600;const refund=o.remedies.reduce((n,r)=>n+Math.round(r.amount*100),0);const net=sale-fee-refund;
   expected[orderId]=sale-cogs-freight-fee-refund;
   const pairs:Array<[Work8FinanceEvent['kind'],number]>=[['SALE',sale],['COGS',cogs],['FREIGHT',freight],['FEE',fee],['DUTY',0],['DISCOUNT',0]];
   if(refund)pairs.push(['REFUND',refund]);
   if(net>0){pairs.push(['SETTLEMENT',net]);if(mode==='PAYOUT_DELAY')pairs.push(['PAYOUT_HOLD',net]);else pairs.push(['BANK_RECEIPT',net]);}
   pairs.push(['SUPPLIER_PAYMENT',cogs+freight]);
   for(const [kind,minor] of pairs)events.push({id:taskId+'-financial-'+sequence,orderId,sourceReceiptDigest:source.digest,kind,minor,currency:o.order.currency,classification:'SIMULATION',assumptionRef:'synthetic:pre-registered-financial-scenario',at:new Date(now+(++sequence)*1000).toISOString()});
  }
  const cutoffAt=new Date(now+3600000).toISOString();const financial=projectWork8Finance(store,workspace,missionId,events,cutoffAt);
  check(financial.complete&&financial.balanced&&financial.conserved,'FINANCE_RECONCILIATION');
  for(const row of financial.orders){check(row.contributionMinor===expected[row.orderId],'INDEPENDENT_CONTRIBUTION');if(mode==='PAYOUT_DELAY')check((row.payoutHeldMinor??0)>0&&row.realisedContributionMinor===null,'PAYOUT_HOLD');else if(mode==='LOSS')check((row.contributionMinor??0)<0&&(row.cashNeedMinor??0)>0,'LOSS_AND_CASH_NEED');else check(row.realisedContributionMinor===expected[row.orderId],'REALISED_CONTRIBUTION');}
  const duplicate=projectWork8Finance(store,workspace,missionId,[...events,...events],cutoffAt);check(digest({...duplicate,duplicates:0})===digest(financial),'FINANCE_RETRY');
  reports.push({scenarioId:taskId,seed,mode,classification:'SYNTHETIC_EXAM_NOT_REAL_PRODUCT',clock:'ACCELERATED_VIRTUAL_TIME',virtualAt:new Date(now).toISOString(),restart:'COLD_REOPEN_AFTER_RECEIPT_BEFORE_CURSOR_COMMIT',prefix,receipts,events,expected,financial,result:'PASS',traceDigest:digest({receipts,events,expected,financial})});
 }
 return {classification:'ISOLATED_SYNTHETIC_OPERATING_EXAM',seed,scenarioCount:count,orderCount:count*2,paidInference:0,externalEffects:0,databasePath:filename,clock:'ACCELERATED_VIRTUAL_TIME_NOT_WALL_CLOCK_ENDURANCE',scenarios:reports,traceDigest:digest(reports.map(r=>r.traceDigest)),result:'PASS',limitations:['No real provider or Pillow inference','No production/UI verification','No live authority','No full Work 8 closure']};
 }finally{store.close();}
}
