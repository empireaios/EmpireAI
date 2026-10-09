import type {CommerceState} from './engine.js';
/** Derived isolated entries, never a second finance database or an import into actual Work5 totals. */
export function isolatedFinancialProjection(state:CommerceState){
 const entries=Object.entries(state.orders).flatMap(([orderId,o])=>o.remedies.filter(r=>r.amount>0).flatMap(r=>[
  {orderId,receiptId:r.id,account:'remedy_exposure',debit:r.amount,credit:0,currency:state.candidate.economics.currency},
  {orderId,receiptId:r.id,account:'hypothetical_payable',debit:0,credit:r.amount,currency:state.candidate.economics.currency},
 ]));
 const debit=entries.reduce((n,r)=>n+r.debit,0),credit=entries.reduce((n,r)=>n+r.credit,0);
 return {classification:'SYNTHETIC_EXCLUDED_FROM_ACTUALS',source:'IMMUTABLE_COMMERCE_RECEIPT_PROJECTION',work5Reference:state.candidate.cash.financialDigest,entries,balanced:debit===credit,totalExposure:debit,actualCashMovement:0,actualRevenue:null,actualProfit:null};
}
