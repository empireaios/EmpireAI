import type {InstitutionalMemory} from '../../../institutional-memory/store.js';
import type {GovernedCommerceStore} from './store.js';
import type {Actor,Command} from './contracts.js';
import type {CommerceState} from './engine.js';
/** Additional restrictions only. Original approval, idempotency and locked effect adapters still run. */
export function enforceOwnerSafety(memory:InstitutionalMemory|null,store:GovernedCommerceStore,actor:Actor,command:Command,state:CommerceState|null,now=Date.now()){
 if(!['publication_intent','prepare','intercept'].includes(command.type))return;
 if(!memory)throw Error('SAFETY_POLICY_UNAVAILABLE');
 const policy=memory.safetyPolicy(actor.workspace);
 // Legacy pre-Birth synthetic flows retain Work6 behavior until owner configures additional controls.
 if(!policy)return;
 if(command.type==='publication_intent'){if(policy.breakers.listingPublication)throw Error('OWNER_LISTING_PAUSED');return;}
 if(policy.breakers.supplierPurchases)throw Error('OWNER_PURCHASES_PAUSED');
 if(!state||!('orderId' in command))throw Error('SAFETY_ORDER_REQUIRED');
 const order=state.orders[command.orderId]?.order;if(!order)throw Error('SAFETY_ORDER_REQUIRED');
 if(order.currency!=='SGD'||state.candidate.offer.currency!=='SGD')throw Error('SAFETY_FX_UNVERIFIED');
 const quantity=order.items.reduce((n,item)=>n+item.quantity,0);
 const exposure=(state.candidate.offer.price+state.candidate.offer.freight)*quantity;
 const limits=policy.limits;if(limits.perOrder===null||limits.daily===null||limits.aggregate===null)throw Error('OWNER_SPEND_LIMIT_UNKNOWN');
 if(exposure>limits.perOrder)throw Error('OWNER_ORDER_LIMIT_EXCEEDED');
 const latest=store.db.prepare(`SELECT r.record FROM commerce_runtime_receipts r JOIN (SELECT mission,max(version) version FROM commerce_runtime_receipts WHERE workspace=? GROUP BY mission) m ON r.mission=m.mission AND r.version=m.version WHERE r.workspace=?`).all(actor.workspace,actor.workspace);
 let aggregate=0;
 for(const row of latest){const receipt=JSON.parse(String(row.record));const s=receipt.state as CommerceState;
  // Actual and isolated exposure must never be combined.
  if(s.candidate.offer.provenance.classification!==state.candidate.offer.provenance.classification)continue;
  for(const [id,o] of Object.entries(s.orders)){if(id===order.orderId)continue;if(['CANCELLED','REJECTED','RECEIVED'].includes(o.outcome))continue;if(o.order.currency!=='SGD'||s.candidate.offer.currency!=='SGD')throw Error('SAFETY_FX_UNVERIFIED');const value=(s.candidate.offer.price+s.candidate.offer.freight)*o.order.items.reduce((n,i)=>n+i.quantity,0);aggregate+=value;}
 }
 // Until settlement release is verified, carry prior commitments into the daily bound conservatively.
 if(aggregate+exposure>limits.daily)throw Error('OWNER_DAILY_LIMIT_EXCEEDED');
 if(aggregate+exposure>limits.aggregate)throw Error('OWNER_AGGREGATE_LIMIT_EXCEEDED');
}
