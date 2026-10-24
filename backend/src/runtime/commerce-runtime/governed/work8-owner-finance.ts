import type {CommerceState} from './engine.js';
import type {GovernedCommerceStore} from './store.js';
const currencyDigits:Record<string,number>={USD:2,SGD:2,EUR:2,GBP:2,AUD:2,CAD:2,JPY:0};
function minor(value:number,currency:string){const digits=currencyDigits[currency];if(digits===undefined||!Number.isFinite(value))return null;const n=value*10**digits;return Number.isSafeInteger(Math.round(n))&&Math.abs(n-Math.round(n))<1e-7?Math.round(n):null;}
/** Owner readback of canonical simulated commerce. Never books financial events or invents fee/settlement evidence. */
export function readOwnerSimulatedFinance(store:GovernedCommerceStore,workspace:string,missionId:string){
 const receipt=store.history(workspace,missionId).at(-1);if(!receipt)throw Error('OWNER_FINANCE_MISSION_NOT_FOUND');
 const state=receipt.state as unknown as CommerceState;
 if(receipt.classification!=='SYNTHETIC'||receipt.externalEffects!==0||state.externalEffects!==0)throw Error('OWNER_FINANCE_SIMULATION_BOUNDARY');
 const orders=Object.entries(state.orders).map(([orderId,managed])=>{
  const order=managed.order;if(order.integrationMode!=='SANDBOX')throw Error('OWNER_FINANCE_SIMULATION_BOUNDARY');
  const currency=order.currency;const aligned=state.candidate.offer.currency===currency&&state.candidate.economics.currency===currency&&order.items.every(i=>i.currency===currency&&i.unitCost===state.candidate.offer.price);
  const quantity=order.items.reduce((n,i)=>n+i.quantity,0);
  const quotedRevenueMinor=aligned?minor(quantity*state.candidate.economics.sellingPrice,currency):null;
  const quotedCogsMinor=aligned?minor(order.items.reduce((n,i)=>n+i.quantity*i.unitCost,0),currency):null;
  const quotedFreightMinor=aligned?minor(quantity*state.candidate.offer.freight,currency):null;
  const refundIntents=managed.remedies.filter(r=>r.kind==='REFUND');const refundIntentMinor=refundIntents.length?minor(refundIntents.reduce((n,r)=>n+r.amount,0),currency):null;
  const missing=['Collected customer payment','Charged marketplace fees','Assessed duty and tax','Supplier invoice or credit','Marketplace settlement','Payout or hold','Bank receipt'];
  if(!aligned)missing.unshift('Matching currency and supplier cost evidence');
  if(quotedRevenueMinor===null||quotedCogsMinor===null||quotedFreightMinor===null)missing.unshift('Supported exact minor-unit amounts');
  return {orderId,title:state.candidate.title,quantity,currency,minorUnitDigits:currencyDigits[currency]??null,status:managed.outcome,classification:'SIMULATION_EXCLUDED_FROM_ACTUALS' as const,
   quotedRevenueMinor,quotedCogsMinor,quotedFreightMinor,refundIntentMinor,
   collectedRevenueMinor:null,chargedFeeMinor:null,dutyTaxMinor:null,supplierCreditMinor:null,settlementMinor:null,payoutHeldMinor:null,bankReceiptMinor:null,realisedContributionMinor:null,
   complete:false,summary:managed.outcome==='UNKNOWN'?'Supplier outcome unknown. Automatic resubmission is blocked.':managed.outcome==='DELIVERED'?'Simulated delivery recorded. Settlement and profit remain unverified.':'Simulated order recorded. Financial settlement remains unverified.',
   missing,source:{missionId,receiptId:receipt.id,receiptDigest:receipt.digest,receiptVersion:receipt.version,orderCreatedAt:order.createdAt,priceBasis:'CANONICAL_SIMULATION_ECONOMICS_NOT_COLLECTED_PAYMENT',supplierCostBasis:'CANONICAL_ORDER_LINE_AND_OFFER_QUOTE_NOT_INVOICE',offerProvenance:state.candidate.offer.provenance,refundIntentIds:refundIntents.map(r=>r.id)},
   assumptions:{classification:'FORECAST_ASSUMPTIONS_NOT_CHARGES',feePercent:state.candidate.economics.feePercent,dutiesPerUnit:state.candidate.economics.duties,taxPerUnit:state.candidate.economics.tax},
  };
 });
 return {missionId,sourceReceiptDigest:receipt.digest,classification:'SIMULATION_EXCLUDED_FROM_ACTUALS' as const,status:orders.length?'INCOMPLETE_FINANCIAL_EVIDENCE':'NO_SIMULATED_ORDERS',orders,complete:false,actualRevenue:null,actualProfit:null,actualCashMovement:0,financialReference:state.candidate.cash.financialDigest,summary:orders.length?'Quoted amounts and simulated refund intents are visible. Missing charges, settlement and bank evidence stay unknown.':'No simulated orders are recorded for this mission.',technologyCosts:'SEPARATE_COST_CENTRE',grantsAuthority:false,limitations:['Quotes and refund intents are not collected revenue, settled charges or bank receipts','No financial scenario events are inferred from an order status','Currencies are not combined or converted']};
}
