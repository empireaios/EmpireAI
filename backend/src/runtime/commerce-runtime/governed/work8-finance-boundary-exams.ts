import {GovernedCommerceStore,digest} from './store.js';
import {GovernedCommerceEngine} from './engine.js';
import {acceptanceScenario} from './scenario.js';
import {projectWork8Finance,type Work8FinanceEvent} from './work8-finance.js';
const at='2026-10-11T00:00:00.000Z',now=Date.parse(at);
const check=(condition:boolean,code:string)=>{if(!condition)throw Error('FINANCE_BOUNDARY_'+code);};
export function runWork8FinanceBoundaryExams(){
 const store=new GovernedCommerceStore(':memory:'),engine=new GovernedCommerceEngine(store,()=>now),workspace='synthetic:finance-boundary';
 const create=(missionId:string,currency:'SGD')=>{
  const s=acceptanceScenario(workspace,'synthetic-owner',now);s.candidate.offer.currency=currency;s.candidate.economics.currency=currency;s.order.currency=currency;s.order.items.forEach(i=>i.currency=currency);
  const approvalDigest=digest({candidate:s.candidate,listing:s.listing});for(const step of s.steps)if(step.command.type==='review'||step.command.type==='approve')step.command.digest=approvalDigest;
  for(const [i,step] of s.steps.slice(0,5).entries())engine.execute(step.actor,{id:missionId+':'+i,missionId,expectedVersion:i,command:step.command});
  const source=store.history(workspace,missionId).at(-1)!;
  return {source,currency,missionId,events:(pairs:Array<[Work8FinanceEvent['kind'],number|null]>)=>pairs.map(([kind,minor],i):Work8FinanceEvent=>({id:missionId+':finance:'+i,orderId:s.order.orderId,sourceReceiptDigest:source.digest,kind,minor,currency,classification:'SIMULATION',assumptionRef:'synthetic:preregistered-finance-boundary',at:new Date(now+i*1000).toISOString()}))};
 };
 const cases=[];
 try{
  const usd=create('sgd','SGD');const before=digest(store.history(workspace,'sgd'));const base:Array<[Work8FinanceEvent['kind'],number|null]>=[['SALE',8000],['COGS',1600],['FREIGHT',600],['FEE',400],['DUTY',0],['DISCOUNT',0]];
  const replay=(context:typeof usd,pairs:Array<[Work8FinanceEvent['kind'],number|null]>,cutoff='2026-10-12T00:00:00.000Z')=>{const events=context.events(pairs);return {events,projection:projectWork8Finance(store,workspace,context.missionId,events,cutoff)};};
  const chargeback=replay(usd,[...base,['CHARGEBACK',6000],['SUPPLIER_PAYMENT',2200]]);const chargebackExpected=8000-1600-600-400-6000;check(chargeback.projection.orders[0]!.contributionMinor===chargebackExpected&&chargebackExpected<0,'CHARGEBACK');cases.push({id:'chargeback',expected:{contributionMinor:chargebackExpected},...chargeback});
  const missing=replay(usd,base.map(([k,v])=>[k,k==='FEE'?null:v]));check(missing.projection.complete===false&&missing.projection.orders[0]!.contributionMinor===null,'MISSING_FEE');let assumptionDenial='';try{projectWork8Finance(store,workspace,'sgd',usd.events(base).map(e=>e.kind==='FEE'?{...e,assumptionRef:undefined}:e),'2026-10-12T00:00:00Z');}catch(e){assumptionDenial=(e as Error).message;}check(assumptionDenial==='FINANCE_SIMULATION_ASSUMPTION_REQUIRED','FEE_ASSUMPTION');cases.push({id:'missing-fee',expected:{contributionMinor:null,complete:false},assumptionDenial,...missing});
  const lifecycle:Array<[Work8FinanceEvent['kind'],number|null]>=[...base,['SUPPLIER_PAYMENT',2200],['SETTLEMENT',7600],['BANK_RECEIPT',7600]];
  const early=replay(usd,lifecycle,new Date(now+6000).toISOString()),late=replay(usd,lifecycle);const expected=8000-1600-600-400;
  check(early.projection.pending.length===2&&early.projection.orders[0]!.realisedContributionMinor===null&&late.projection.orders[0]!.realisedContributionMinor===expected,'PERIOD_CUTOFF');cases.push({id:'period-cutoff',expected:{pendingBefore:2,realisedBefore:null,realisedAfter:expected},before:early,after:late});
  check(early.projection.orders[0]!.bankMinor===-2200&&early.projection.orders[0]!.cashNeedMinor===2200&&early.projection.orders[0]!.contributionMinor===expected,'NEGATIVE_CASH');cases.push({id:'negative-cash',expected:{bankMinor:-2200,cashNeedMinor:2200,contributionMinor:expected},...early});
  let fxDenial='';try{projectWork8Finance(store,workspace,'sgd',usd.events(base).map(e=>({...e,currency:'USD'})),'2026-10-12T00:00:00Z');}catch(e){fxDenial=(e as Error).message;}
  check(fxDenial==='FINANCE_FX_EVIDENCE_REQUIRED','CURRENCY_BOUNDARY');
  const unsupported=acceptanceScenario(workspace,'synthetic-owner',now);let canonicalCurrencyDenial='';
  try{engine.execute(unsupported.actors.PROPOSER!,{id:'unsupported-usd',missionId:'unsupported-usd',expectedVersion:0,command:{type:'research',candidate:{...unsupported.candidate,economics:{...unsupported.candidate.economics,currency:'USD'}}}});}catch(e){canonicalCurrencyDenial=(e as Error).message;}
  check(canonicalCurrencyDenial.includes('SGD')&&store.history(workspace,'unsupported-usd').length===0,'UNSUPPORTED_CANONICAL_CURRENCY');
  cases.push({id:'separate-currency-ledgers',result:'CAPABILITY_GAP',expected:{foreignEvent:'REJECT_WITHOUT_FX_EVIDENCE'},fxDenial,canonicalCurrencyDenial,reason:'Canonical economicsSchema permits SGD only; separate canonical USD ledger and explicit FX conversion are not implemented.',sgd:late});
  check(digest(store.history(workspace,'sgd'))===before,'CANONICAL_HISTORY_UNCHANGED');
  return {schema:'work8-finance-boundary-exam-v1',result:'PARTIAL_WITH_CAPABILITY_GAP',classification:'SIMULATION_EXCLUDED_FROM_ACTUALS',workspace,receipts:store.history(workspace,'sgd'),cases,caseCount:cases.length,externalEffects:0,paidInference:0,actualCashMovement:0,canonicalHistoryPreserved:true,clock:'VIRTUAL',limitations:['Canonical economics schema currently SGD-only; separate currency ledgers blocked','No FX conversion capability claimed','No real settlement or bank integration','No full Work 8 closure'],traceDigest:digest(cases)};
 }finally{store.close();}
}
