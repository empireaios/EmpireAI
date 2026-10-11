import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {CommerceState} from './engine.js';
import {GovernedCommerceStore,digest} from './store.js';

const kinds=['SALE','DISCOUNT','COGS','FREIGHT','FEE','DUTY','REFUND','CHARGEBACK','SUPPLIER_CREDIT','SETTLEMENT','PAYOUT_HOLD','PAYOUT_RELEASE','BANK_RECEIPT','SUPPLIER_PAYMENT'] as const;
const eventSchema=z.object({id:z.string().min(1).max(160),orderId:z.string().min(1),sourceReceiptDigest:z.string().regex(/^[a-f0-9]{64}$/),kind:z.enum(kinds),currency:z.string().regex(/^[A-Z]{3}$/),minor:z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable(),at:z.string().datetime({offset:true}),classification:z.literal('SIMULATION'),assumptionRef:z.string().min(3).max(300).optional()}).strict();
export type Work8FinanceEvent=z.infer<typeof eventSchema>;
type Account='receivable'|'revenue'|'discount'|'cogs'|'freight'|'fee'|'duty'|'refund'|'chargeback'|'supplierPayable'|'supplierCredit'|'settlement'|'held'|'bank';
export type Work8JournalLine={eventId:string;orderId:string;currency:string;account:Account;debitMinor:number;creditMinor:number};
const accounts:Record<Work8FinanceEvent['kind'],readonly [Account,Account]>={SALE:['receivable','revenue'],DISCOUNT:['discount','receivable'],COGS:['cogs','supplierPayable'],FREIGHT:['freight','supplierPayable'],FEE:['fee','receivable'],DUTY:['duty','supplierPayable'],REFUND:['refund','receivable'],CHARGEBACK:['chargeback','receivable'],SUPPLIER_CREDIT:['supplierPayable','supplierCredit'],SETTLEMENT:['settlement','receivable'],PAYOUT_HOLD:['held','settlement'],PAYOUT_RELEASE:['settlement','held'],BANK_RECEIPT:['bank','settlement'],SUPPLIER_PAYMENT:['supplierPayable','bank']};
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const add=(a:number,b:number)=>{const n=a+b;if(!Number.isSafeInteger(n))throw Error('FINANCE_INTEGER_OVERFLOW');return n;};

/** Retirement only changes portfolio membership; historical money remains pinned to its prior receipt. */
export function canonicalFinanceSource(store:GovernedCommerceStore,workspace:string,missionId:string){
 const history=store.history(workspace,missionId),latest=history.at(-1);
 if(latest?.command.type!=='retire')return latest;
 const prior=history.at(-2);if(!prior)throw Error('FINANCE_RETIREMENT_SOURCE_INVALID');
 const {retirement,...state}=latest.state;
 const expected={actor:latest.actor.id,at:latest.at,reason:latest.command.reason};
 if(latest.actor.role!=='OWNER'||(prior.state.approval as CommerceState['approval'])?.actor!==latest.actor.id||
    digest(retirement)!==digest(expected)||digest(state)!==digest(prior.state))throw Error('FINANCE_RETIREMENT_SOURCE_INVALID');
 return prior;
}

/** Loads canonical verified history itself. Caller-supplied state or hash is never trusted. */
export function projectWork8Finance(store:GovernedCommerceStore,workspace:string,missionId:string,input:readonly Work8FinanceEvent[],cutoffAt:string){
 if(!(store instanceof GovernedCommerceStore)||!Number.isFinite(Date.parse(cutoffAt)))throw Error('FINANCE_SOURCE_OR_CUTOFF_INVALID');
 const source=canonicalFinanceSource(store,workspace,missionId);if(!source||source.classification!=='SYNTHETIC'||source.externalEffects!==0)throw Error('FINANCE_VERIFIED_RECEIPT_REQUIRED');
 const sourceReceiptDigest=source.digest;const state=source.state as unknown as CommerceState;
 const minor=(value:number,currency:string)=>{if(!['SGD','USD','EUR','GBP','AUD','CAD'].includes(currency))throw Error('FINANCE_CURRENCY_PRECISION_UNSUPPORTED');const n=value*100;if(!Number.isSafeInteger(Math.round(n))||Math.abs(n-Math.round(n))>1e-7)throw Error('FINANCE_CANONICAL_AMOUNT_PRECISION');return Math.round(n);};
 if(state.externalEffects!==0||state.paidInference!==0||Object.values(state.orders).some(o=>o.order.integrationMode!=='SANDBOX'))throw Error('FINANCE_SIMULATION_BOUNDARY');
 const seen=new Map<string,string>();const events:Work8FinanceEvent[]=[];const pending:string[]=[];const unknown:string[]=[];
 let duplicates=0;
 for(const raw of input){const e=eventSchema.parse(raw);const identity=hash(e);const prior=seen.get(e.id);if(prior){if(prior!==identity)throw Error('FINANCE_IDEMPOTENCY_CONFLICT');duplicates++;continue;}seen.set(e.id,identity);
  const order=state.orders[e.orderId];if(!order||order.order.integrationMode!=='SANDBOX'||e.sourceReceiptDigest!==sourceReceiptDigest)throw Error('FINANCE_CANONICAL_SOURCE_MISMATCH');
  if(e.currency!==order.order.currency||e.currency!==state.candidate.offer.currency||e.currency!==state.candidate.economics.currency)throw Error('FINANCE_FX_EVIDENCE_REQUIRED');
  if(e.minor!==null){
   const quantity=order.order.items.reduce((n,item)=>add(n,item.quantity),0);
   const expected:Partial<Record<Work8FinanceEvent['kind'],number>>={SALE:minor(state.candidate.economics.sellingPrice*quantity,e.currency),COGS:order.order.items.reduce((n,item)=>{if(item.unitCost!==state.candidate.offer.price||item.currency!==e.currency)throw Error('FINANCE_CANONICAL_COST_DRIFT');return add(n,minor(item.unitCost*item.quantity,e.currency));},0),FREIGHT:minor(state.candidate.offer.freight*quantity,e.currency),REFUND:order.remedies.filter(r=>r.kind==='REFUND').reduce((n,r)=>add(n,minor(r.amount,e.currency)),0)};
   if(expected[e.kind]!==undefined&&e.minor!==expected[e.kind])throw Error('FINANCE_CANONICAL_AMOUNT_MISMATCH');
   if(expected[e.kind]===undefined&&!e.assumptionRef)throw Error('FINANCE_SIMULATION_ASSUMPTION_REQUIRED');
  }
  if(Date.parse(e.at)<Date.parse(order.order.createdAt))throw Error('FINANCE_EVENT_BEFORE_ORDER');
  if(Date.parse(e.at)>Date.parse(cutoffAt)){pending.push(e.id);continue;}events.push(e);
 }
 events.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 const lines:Work8JournalLine[]=[];const balances=new Map<string,Record<Account,number>>();const totals=new Map<string,Partial<Record<Work8FinanceEvent['kind'],number>>>();
 for(const e of events){if(e.minor===null){unknown.push(e.id);continue;}
  const key=e.orderId+'|'+e.currency;const balance=balances.get(key)??Object.fromEntries(Object.keys(accounts).flatMap(k=>accounts[k as Work8FinanceEvent['kind']]).map(a=>[a,0])) as Record<Account,number>;
  const [debit,credit]=accounts[e.kind];
  if(['SETTLEMENT','PAYOUT_HOLD','PAYOUT_RELEASE','BANK_RECEIPT'].includes(e.kind)&&balance[credit]<e.minor)throw Error('FINANCE_FUNDS_OR_EVENT_ORDER_INVALID');
  if(e.kind==='SUPPLIER_CREDIT'&&-balance.supplierPayable<e.minor)throw Error('FINANCE_CREDIT_EXCEEDS_LIABILITY');
  if(e.kind==='SUPPLIER_PAYMENT'&&-balance.supplierPayable<e.minor)throw Error('FINANCE_PAYMENT_EXCEEDS_LIABILITY');
  balance[debit]=add(balance[debit],e.minor);balance[credit]=add(balance[credit],-e.minor);balances.set(key,balance);
  lines.push({eventId:e.id,orderId:e.orderId,currency:e.currency,account:debit,debitMinor:e.minor,creditMinor:0},{eventId:e.id,orderId:e.orderId,currency:e.currency,account:credit,debitMinor:0,creditMinor:e.minor});
  const t=totals.get(key)??{};if(['SALE','COGS','FREIGHT','FEE','DUTY','DISCOUNT','REFUND'].includes(e.kind)&&t[e.kind]!==undefined)throw Error('FINANCE_DUPLICATE_CATEGORY');t[e.kind]=add(t[e.kind]??0,e.minor);totals.set(key,t);
 }
 const orders=Object.entries(state.orders).map(([orderId,o])=>{
  const key=orderId+'|'+o.order.currency;const b=balances.get(key);const t=totals.get(key)??{};const scoped=events.filter(e=>e.orderId===orderId);
  const missing=['SALE','COGS','FREIGHT','FEE','DUTY','DISCOUNT'].filter(kind=>!scoped.some(e=>e.kind===kind&&e.minor!==null));
  if(o.remedies.some(r=>r.kind==='REFUND'&&r.amount>0)&&!scoped.some(e=>e.kind==='REFUND'&&e.minor!==null))missing.push('REFUND');
  const unknownIds=scoped.filter(e=>e.minor===null).map(e=>e.id);const complete=missing.length===0&&unknownIds.length===0;
  const amount=(kind:Work8FinanceEvent['kind'])=>t[kind]??0;
  // Independent oracle uses source categories, never journal lines or debit/credit mapping.
  const contribution=add(add(amount('SALE'),amount('SUPPLIER_CREDIT')),-['DISCOUNT','COGS','FREIGHT','FEE','DUTY','REFUND','CHARGEBACK'].reduce((n,k)=>add(n,amount(k as Work8FinanceEvent['kind'])),0));
  const assets=add(add(b?.receivable??0,b?.settlement??0),add(b?.held??0,b?.bank??0));const liabilities=-(b?.supplierPayable??0);
  const conserved=add(assets,-liabilities)===contribution;
  const unsettled=(b?.receivable??0)+(b?.settlement??0)+(b?.held??0);const payable=-(b?.supplierPayable??0);
  return {orderId,currency:o.order.currency,missing,unknownIds,contributionMinor:complete?contribution:null,realisedContributionMinor:complete&&unsettled===0&&payable===0?contribution:null,receivableMinor:b?.receivable??null,settlementMinor:b?.settlement??null,payoutHeldMinor:b?.held??null,bankMinor:b?.bank??null,liabilityMinor:b?payable:null,cashNeedMinor:b?Math.max(0,-b.bank):null,conserved,complete};
 });
 const balanced=[...balances.values()].every(b=>Object.values(b).reduce(add,0)===0);
 return {classification:'SIMULATION_EXCLUDED_FROM_ACTUALS' as const,sourceReceiptDigest,work5Reference:state.candidate.cash.financialDigest,eventDigest:hash(events),cutoffAt,events,lines,orders,duplicates,pending,unknown,balanced,conserved:orders.every(o=>o.conserved),complete:orders.length>0&&orders.every(o=>o.complete),actualCashMovement:0,actualRevenue:null,actualProfit:null,technologyCosts:'EXCLUDED_SEPARATE_COST_CENTRE',fx:'NO_IMPLICIT_CONVERSION',sourceVerification:'CANONICAL_IMMUTABLE_HISTORY_READ',noncanonicalAmounts:'EXPLICIT_SIMULATION_ASSUMPTIONS_NOT_SOURCE_FACTS'};
}
