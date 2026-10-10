import {z} from 'zod';
import {digest,type GovernedCommerceStore} from './store.js';
import {projectWork8Finance,type Work8FinanceEvent} from './work8-finance.js';
const bodySchema=z.object({id:z.string().min(1).max(160),from:z.enum(['SGD','USD','EUR','GBP','AUD','CAD']),to:z.enum(['SGD','USD','EUR','GBP','AUD','CAD']),numerator:z.number().int().positive().max(1e9),denominator:z.number().int().positive().max(1e9),rounding:z.literal('EXACT'),observedAt:z.string().datetime({offset:true}),expiresAt:z.string().datetime({offset:true}),classification:z.literal('SIMULATION_ASSUMPTION'),reference:z.string().startsWith('synthetic:').min(12).max(500)}).strict();
export type SimulatedFxQuote={body:z.infer<typeof bodySchema>;digest:string};
/** Exact-rational reporting only. Does not change canonical order/qualification currency or financial authority. */
export function projectSimulatedFx(store:GovernedCommerceStore,workspace:string,missionId:string,events:readonly Work8FinanceEvent[],cutoffAt:string,rawQuote:unknown){
 const parsed=z.object({body:bodySchema,digest:z.string().regex(/^[a-f0-9]{64}$/)}).strict().parse(rawQuote);const q=parsed.body;
 if(digest(q)!==parsed.digest)throw Error('FX_QUOTE_DIGEST_MISMATCH');
 if(q.from===q.to||Date.parse(q.observedAt)>Date.parse(cutoffAt)||Date.parse(q.expiresAt)<=Date.parse(cutoffAt)||Date.parse(q.expiresAt)<=Date.parse(q.observedAt))throw Error('FX_QUOTE_PAIR_OR_FRESHNESS_INVALID');
 const source=projectWork8Finance(store,workspace,missionId,events,cutoffAt);
 if(source.orders.some(o=>o.currency!==q.from)||source.events.some(e=>Date.parse(e.at)<Date.parse(q.observedAt)))throw Error('FX_SOURCE_CURRENCY_OR_PERIOD_MISMATCH');
 const convert=(value:number|null)=>{if(value===null)return null;if(!Number.isSafeInteger(value))throw Error('FX_INVALID_SOURCE_MINOR');const product=BigInt(value)*BigInt(q.numerator),divisor=BigInt(q.denominator);if(product%divisor!==0n)throw Error('FX_FRACTIONAL_MINOR_REQUIRES_EXPLICIT_ROUNDING_POLICY');const n=product/divisor;if(n>BigInt(Number.MAX_SAFE_INTEGER)||n<BigInt(Number.MIN_SAFE_INTEGER))throw Error('FX_INTEGER_OVERFLOW');return Number(n);};
 const lines=source.lines.map(line=>({...line,currency:q.to,sourceCurrency:q.from,sourceDebitMinor:line.debitMinor,sourceCreditMinor:line.creditMinor,debitMinor:convert(line.debitMinor)!,creditMinor:convert(line.creditMinor)!,fxQuoteDigest:parsed.digest,sourceReceiptDigest:source.sourceReceiptDigest}));
 const convertedEvents=source.events.map(e=>({...e,sourceCurrency:e.currency,sourceMinor:e.minor,currency:q.to,minor:convert(e.minor),fxQuoteDigest:parsed.digest}));
 const orders=source.orders.map(o=>{
  const scoped=convertedEvents.filter(e=>e.orderId===o.orderId);const total=(kind:string)=>scoped.filter(e=>e.kind===kind).reduce((n,e)=>n+BigInt(e.minor??0),0n);
  // Independent converted-source category oracle, separate from journal account mapping.
  const expected=total('SALE')+total('SUPPLIER_CREDIT')-['DISCOUNT','COGS','FREIGHT','FEE','DUTY','REFUND','CHARGEBACK'].reduce((n,k)=>n+total(k),0n);
  const balance=(account:string)=>lines.filter(l=>l.orderId===o.orderId&&l.account===account).reduce((n,l)=>n+BigInt(l.debitMinor)-BigInt(l.creditMinor),0n);
  const netAssets=balance('receivable')+balance('settlement')+balance('held')+balance('bank')+balance('supplierPayable');
  if(netAssets!==expected)throw Error('FX_CONSERVATION_FAILURE');
  return {...o,currency:q.to,sourceCurrency:q.from,contributionMinor:convert(o.contributionMinor),realisedContributionMinor:convert(o.realisedContributionMinor),receivableMinor:convert(o.receivableMinor),settlementMinor:convert(o.settlementMinor),payoutHeldMinor:convert(o.payoutHeldMinor),bankMinor:convert(o.bankMinor),liabilityMinor:convert(o.liabilityMinor),cashNeedMinor:convert(o.cashNeedMinor),conserved:true};
 });
 const balanced=lines.reduce((n,l)=>n+BigInt(l.debitMinor)-BigInt(l.creditMinor),0n)===0n;if(!balanced)throw Error('FX_UNBALANCED_TRANSLATION');
 return {classification:'SIMULATED_FX_TRANSLATION_NOT_BANK_CONVERSION' as const,source,translated:{currency:q.to,lines,events:convertedEvents,orders,balanced,conserved:true},quote:parsed,quoteBasis:'EXPLICIT_SIMULATION_ASSUMPTION_NOT_MARKET_RATE',sourceReceiptDigest:source.sourceReceiptDigest,canonicalCurrencyUnchanged:true,grantsAuthority:false,actualCashMovement:0,actualRevenue:null,actualProfit:null,rounding:'EXACT_NO_SILENT_ROUNDING',digest:digest({sourceDigest:source.eventDigest,quoteDigest:parsed.digest,lines,orders})};
}
