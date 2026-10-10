import {digest, type GovernedCommerceStore, type Receipt} from './store.js';
import type {CommerceState} from './engine.js';

// Variants and marketplaces do not multiply a product's capacity allowance.
export const portfolioIdentity=(s:CommerceState)=>digest({provider:s.candidate.offer.provider,product:s.candidate.productId});
/** Same immutable receipt store and caller transaction as publication; no second capacity cache. */
export function activePortfolio(store:GovernedCommerceStore,workspace:string){
 const rows=store.db.prepare(`SELECT r.record FROM commerce_runtime_receipts r JOIN
  (SELECT mission,max(version) version FROM commerce_runtime_receipts WHERE workspace=? GROUP BY mission) m
  ON r.mission=m.mission AND r.version=m.version WHERE r.workspace=?`).all(workspace,workspace);
 const identities=new Set<string>();
 for(const row of rows){
  const receipt=JSON.parse(String(row.record)) as Receipt;
  const {digest:expected,...body}=receipt;
  if(receipt.workspace!==workspace||digest(body)!==expected)throw Error('COMMERCE_JOURNAL_CORRUPT');
  const s=receipt.state as unknown as CommerceState;
  if(s.publicationIntent&&!s.retirement)identities.add(portfolioIdentity(s));
 }
 return {activeCount:identities.size,identities:[...identities].sort(),ceiling:1000,classification:'SIMULATED_PORTFOLIO_ONLY' as const};
}
