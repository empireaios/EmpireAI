import {digest,type GovernedCommerceStore,type Receipt} from './store.js';
import type {CommerceState} from './engine.js';

const stockIdentity=(s:CommerceState)=>digest({provider:s.candidate.offer.provider,product:s.candidate.offer.productId,variant:s.candidate.offer.variantId,warehouse:s.candidate.offer.warehouseId});
/** Conservative simulated commitments: no inferred replenishment or refund-based stock release. */
export function committedSimulatedStock(store:GovernedCommerceStore,workspace:string,state:CommerceState){
 const identity=stockIdentity(state);let units=0;
 const rows=store.db.prepare(`SELECT r.record FROM commerce_runtime_receipts r JOIN
 (SELECT mission,max(version) version FROM commerce_runtime_receipts WHERE workspace=? GROUP BY mission) m
 ON r.mission=m.mission AND r.version=m.version WHERE r.workspace=?`).all(workspace,workspace);
 for(const row of rows){
  const receipt=JSON.parse(String(row.record)) as Receipt;const {digest:expected,...body}=receipt;
  if(receipt.workspace!==workspace||digest(body)!==expected)throw Error('COMMERCE_JOURNAL_CORRUPT');
  const candidate=receipt.state as unknown as CommerceState;if(stockIdentity(candidate)!==identity)continue;
  store.history(workspace,receipt.missionId);
  for(const order of Object.values(candidate.orders))if(!['CANCELLED','REJECTED'].includes(order.outcome)){
   for(const item of order.order.items){units+=item.quantity;if(!Number.isSafeInteger(units))throw Error('STOCK_COMMITMENT_OVERFLOW');}
  }
 }
 return units;
}
