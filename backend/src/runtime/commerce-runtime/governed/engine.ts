import {projectEntities} from './entities.js';
import {PIE_EVALUATION_WEIGHTS} from '../../../intelligence/product-intelligence-engine/types.js';
import {computeMarginScore,computeShippingScore} from '../../../intelligence/product-intelligence-engine/score-computers.js';
import {interceptWrite} from './providers.js';
import {economics} from '../../../finance/financial-centre.js';
import {actorSchema,envelopeSchema,type Actor,type Candidate,type Listing,type CanonicalOrder,type Outcome,type EntityKind} from './contracts.js';
import {digest,GovernedCommerceStore,type Receipt} from './store.js';

type ManagedOrder={order:CanonicalOrder;intentId?:string;providerId?:string;outcome:'RECEIVED'|'PREPARED'|'ACCEPTED'|'UNKNOWN'|'REJECTED'|'PARTIAL'|'SHIPPED'|'DELIVERED'|'CANCELLED'|'RECONCILIATION_REQUIRED';accepted:number;shipped:number;delivered:number;tracking:string[];lastTrackingAt:string|null;shipments:Record<string,{quantity:number;delivered:boolean;carrier:string;tracking:string}>;remedies:Array<{id:string;kind:string;amount:number;quantity:number;financialClass:'SYNTHETIC_EXCLUDED_FROM_ACTUALS'}>};
export type CommerceState={phase:'RESEARCHED'|'QUALIFIED'|'REJECTED'|'REVIEWED'|'APPROVED'|'PREPARED';candidate:Candidate;candidateDigest:string;qualification:ReturnType<typeof qualify>;proposer:string;review?:{actor:string;digest:string;decision:string};approval?:{actor:string;digest:string;expiresAt:string;maxExposure:number;revoked:boolean};listing?:Listing;listingDigest?:string;orders:Record<string,ManagedOrder>;outcomes:Outcome[];reversed:string[];decisions:Array<{id:string;evidenceIds:string[];actions:string[];days:number[]}>;paidInference:0;externalEffects:0};
const fail=(code:string):never=>{throw Error(code);};
const sumQuantity=(o:CanonicalOrder)=>o.items.reduce((n,item)=>n+item.quantity,0);
function fresh(p:{observedAt:string;expiresAt:string},now:number){return Date.parse(p.observedAt)<=now&&Date.parse(p.expiresAt)>now&&Date.parse(p.expiresAt)>Date.parse(p.observedAt);}
/** Hard source/economic gates surround ranking. Scores cannot grant authority. */
export function qualify(c:Candidate,now:number){
 const e=economics(c.economics);const reasons:string[]=[];
 if(c.restricted)reasons.push('RESTRICTED_PRODUCT');
 if(!fresh(c.offer.provenance,now))reasons.push('STALE_INVENTORY_OR_QUOTE');
 if(c.offer.provenance.classification==='UNKNOWN')reasons.push('SUPPLIER_EVIDENCE_UNKNOWN');
 if(c.offer.stock<1)reasons.push('STOCKOUT');
 if(c.offer.destination!==c.economics.country||c.offer.productId!==c.productId)reasons.push('SOURCE_IDENTITY_MISMATCH');
 if(!c.cash.fxVerified)reasons.push('FX_UNKNOWN');
 if(c.cash.available===null||c.cash.liabilities===null)reasons.push('CASH_OR_LIABILITY_UNKNOWN');
 const exposure=e.input.productCost+e.input.freight+e.input.fulfilment+e.input.duties+e.input.refundLoss;
 const available=c.cash.available===null||c.cash.liabilities===null?null:c.cash.available-c.cash.liabilities-c.cash.committed;
 if(available!==null&&available<exposure)reasons.push('INSUFFICIENT_CASH');
 if(c.offer.currency===c.economics.currency&&(c.offer.price!==c.economics.productCost||c.offer.freight!==c.economics.freight))reasons.push('ECONOMIC_SOURCE_DRIFT');
 if(c.cash.budget<exposure)reasons.push('BUDGET_EXCEEDED');
 if(!e.input.complete||e.input.evidenceRefs.length===0)reasons.push('ECONOMICS_INCOMPLETE');
 if(e.net<=0||e.input.sellingPrice<e.minimumViablePrice)reasons.push('NON_POSITIVE_MARGIN');
 const kinds=['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE'] as const;
 for(const kind of kinds)if(!c.evidence.some(x=>x.kind===kind&&x.verified&&x.value!==null&&fresh(x.provenance,now)&&x.provenance.classification!=='UNKNOWN'))reasons.push('MISSING_'+kind);
 if(c.evidence.some(x=>x.kind==='COMPLIANCE'&&x.value!==null&&x.value<100))reasons.push('COMPLIANCE_DENIED');
 const valid=c.evidence.filter(x=>x.verified&&x.value!==null&&fresh(x.provenance,now));
 const value=(kind:string)=>valid.find(x=>x.kind===kind)?.value??0;
 const scores={demandScore:value('DEMAND'),competitionScore:value('COMPETITION'),marginScore:computeMarginScore((c.economics.sellingPrice-e.net-c.economics.freight)*100,c.economics.sellingPrice*100,c.economics.freight*100),shippingScore:computeShippingScore(c.economics.freight*100,c.economics.sellingPrice*100,{name:'CJ',reliabilityScore:value('QUALITY'),avgShipDays:c.offer.leadDays,region:c.offer.origin}),supplierReliability:value('QUALITY')};
 const score=Math.round(Object.entries(PIE_EVALUATION_WEIGHTS).reduce((n,[k,w])=>n+scores[k as keyof typeof scores]*w,0));
 return {qualified:reasons.length===0,reasons,score,confidence:c.evidence.length?valid.length/c.evidence.length:0,economics:e,exposure,available,classification:'SYNTHETIC_OR_EVIDENCED_SCENARIO_NOT_ACTUAL',genuinelyProfitable:false};
}
export class GovernedCommerceEngine {
 constructor(readonly store:GovernedCommerceStore,readonly clock:()=>number=Date.now){}
 execute(actorInput:Actor,input:unknown):Receipt{
  const actor=actorSchema.parse(actorInput),e=envelopeSchema.parse(input);const now=this.clock(),at=new Date(now).toISOString();
  return this.store.transaction(()=>{
   const requestDigest=digest({actor,input:e});const prior=this.store.prior(actor.workspace,e.id);
   if(prior){this.store.history(actor.workspace,prior.missionId);if(prior.requestDigest!==requestDigest)fail('IDEMPOTENCY_CONFLICT');return prior;}
   const history=this.store.history(actor.workspace,e.missionId);if(history.length!==e.expectedVersion)fail('VERSION_FENCE_CONFLICT');if(history.length>=500)fail('MISSION_EVENT_LIMIT');
   const last=history.at(-1);let state=last?structuredClone(last.state) as unknown as CommerceState:null;
   const cmd=e.command;let entities:Array<{kind:EntityKind;id:string}>=[];
   const emit=(kind:EntityKind,suffix:string)=>entities.push({kind,id:e.missionId+':'+suffix});
   if(cmd.type==='research'){
    if(actor.role!=='PROPOSER')fail('PROPOSER_REQUIRED');
    if(state&&state.phase!=='REJECTED')fail('NEW_MISSION_REQUIRED');
    if(state&&digest(cmd.candidate.evidence)===digest(state.candidate.evidence)&&digest(cmd.candidate.offer)===digest(state.candidate.offer))fail('NEW_EVIDENCE_REQUIRED');
    const q=qualify(cmd.candidate,now);
    state={phase:q.qualified?'QUALIFIED':'REJECTED',candidate:cmd.candidate,candidateDigest:digest(cmd.candidate),qualification:q,proposer:actor.id,orders:{},outcomes:[],reversed:[],decisions:[],paidInference:0,externalEffects:0};
    for(const kind of ['Opportunity','ProductCandidate','Product','SupplierOffer','SupplierSKU','Variant','InventoryObservation','FreightQuote','EconomicAssessment','RiskAssessment','FinancialReference'] as EntityKind[])emit(kind,kind);
    for(const evidence of cmd.candidate.evidence)emit('ResearchEvidence',evidence.id);
   }else{
    if(!state)fail('MISSION_NOT_FOUND');
    const s=state!;
    const order=(id:string):ManagedOrder=>s.orders[id]??fail('ORDER_NOT_FOUND');
    const approval=()=>{
     const a=s.approval;
     if(!a||a.revoked||a.digest!==s.candidateDigest||Date.parse(a.expiresAt)<=now)fail('APPROVAL_INVALID_OR_EXPIRED');
     if(!s.review||s.review.decision!=='APPROVE'||s.review.digest!==s.candidateDigest||s.review.actor===s.proposer||a!.actor===s.proposer||a!.actor===s.review.actor)fail('FOUR_EYES_REQUIRED');
     if(actor.role!=='EXECUTOR'||[s.proposer,s.review!.actor,a!.actor].includes(actor.id))fail('EXECUTOR_SEPARATION_REQUIRED');
     const q=qualify(s.candidate,now);if(!q.qualified)fail('EVIDENCE_REQUALIFICATION_REQUIRED');
     if(q.exposure>a!.maxExposure)fail('FINANCIAL_AUTHORITY_EXCEEDED');return a!;
    };
    switch(cmd.type){
     case 'review':
      if(actor.role!=='REVIEWER'||actor.id===s.proposer)fail('INDEPENDENT_REVIEWER_REQUIRED');
      if(cmd.digest!==s.candidateDigest||!['QUALIFIED','REVIEWED'].includes(s.phase))fail('STALE_OR_UNQUALIFIED_REVIEW');
      if(!qualify(s.candidate,now).qualified)fail('EVIDENCE_REQUALIFICATION_REQUIRED');
      s.review={actor:actor.id,digest:cmd.digest,decision:cmd.decision};s.phase=cmd.decision==='APPROVE'?'REVIEWED':'REJECTED';delete s.approval;emit('RiskAssessment','review');break;
     case 'approve':
      if(actor.role!=='OWNER'||actor.id===s.proposer||actor.id===s.review?.actor)fail('OWNER_SEPARATION_REQUIRED');
      if(!s.listing||s.phase!=='REVIEWED'||s.review?.decision!=='APPROVE'||cmd.digest!==s.candidateDigest)fail('UNREVIEWED_OR_STALE_APPROVAL');
      if(Date.parse(cmd.expiresAt)<=now||Date.parse(cmd.expiresAt)>now+86400000)fail('INVALID_APPROVAL_EXPIRY');
      if(!qualify(s.candidate,now).qualified||cmd.maxExposure<s.qualification.exposure)fail('FINANCIAL_AUTHORITY_EXCEEDED');
      s.approval={actor:actor.id,digest:cmd.digest,expiresAt:cmd.expiresAt,maxExposure:cmd.maxExposure,revoked:false};s.phase='APPROVED';emit('Approval','approval');break;
     case 'revoke':
      if(actor.role!=='OWNER')fail('OWNER_REQUIRED');if(!s.approval)fail('APPROVAL_NOT_FOUND');s.approval!.revoked=true;emit('Approval','revocation');break;
     case 'listing':{
      if(actor.role!=='PROPOSER'||actor.id!==s.proposer||Object.keys(s.orders).length)fail('LISTING_PROPOSER_OR_STATE_INVALID');const l=cmd.listing;
      if(l.productId!==s.candidate.productId||l.category!==s.candidate.category||!l.variants.some(v=>v.sku===s.candidate.offer.sku&&v.variantId===s.candidate.offer.variantId))fail('LISTING_IDENTITY_MISMATCH');
      const evidenceIds=s.candidate.evidence.map(x=>x.id);
      if(l.sourceEvidence.some(x=>!evidenceIds.includes(x))||l.claims.some(x=>!evidenceIds.includes(x.evidenceId))||l.images.some(x=>!evidenceIds.includes(x.rightsEvidence)))fail('LISTING_PROVENANCE_MISSING');
      if(l.images.some(x=>new URL(x.url).protocol!=='https:'))fail('UNSAFE_IMAGE_URL');
      interceptWrite({id:e.id,provider:'AMAZON',operation:'PUBLISH',approvalDigest:digest({candidate:s.candidate,listing:l}),payloadDigest:digest(l)});
      s.listing=l;s.listingDigest=digest(l);s.candidateDigest=digest({candidate:s.candidate,listing:l});delete s.review;delete s.approval;s.phase='QUALIFIED';emit('ListingPackage','listing:'+String(e.expectedVersion+1));emit('MarketplaceIntent','listing-validation');break;
     }
     case 'intake':{
      approval();if(!s.listing)fail('LISTING_REQUIRED');const o=cmd.order;
      if(o.workspaceId!==actor.workspace||o.integrationMode!=='SANDBOX'||o.status!=='DRAFT'||o.fulfillmentStatus!=='PENDING'||o.supplierOrderId||o.approval)fail('INVALID_INTAKE_AUTHORITY');
      if(s.orders[o.orderId])fail('DUPLICATE_ORDER');
      if(!s.candidate.evidence.some(x=>x.id===cmd.paymentEvidence&&x.kind==='PAYMENT'&&x.verified&&fresh(x.provenance,now)))fail('PAYMENT_EVIDENCE_REQUIRED');
      if(o.shippingAddress.countryCode!==s.candidate.offer.destination)fail('DESTINATION_MISMATCH');
      if(o.currency!==s.candidate.offer.currency||o.items.some(x=>x.currency!==o.currency||x.unitCost!==s.candidate.offer.price))fail('ORDER_PRICE_OR_CURRENCY_DRIFT');
      if(o.items.some(x=>x.supplierSku!==s.candidate.offer.sku||x.supplierProductId!==s.candidate.offer.productId))fail('VARIANT_MAPPING_MISMATCH');
      const quantity=sumQuantity(o);if(quantity>s.candidate.offer.stock)fail('STOCKOUT');
      const committed=Object.values(s.orders).filter(x=>x.outcome!=='CANCELLED'&&x.outcome!=='REJECTED').reduce((n,x)=>n+sumQuantity(x.order)*s.qualification.exposure,0);
      if(quantity*s.qualification.exposure+committed>Math.min(s.approval!.maxExposure,s.candidate.cash.budget,s.qualification.available??0))fail('CAPITAL_COMMITMENT_EXCEEDED');
      s.orders[o.orderId]={order:o,outcome:'RECEIVED',accepted:0,shipped:0,delivered:0,tracking:[],lastTrackingAt:null,shipments:{},remedies:[]};emit('Order',o.orderId);o.items.forEach((_,i)=>emit('OrderLine',o.orderId+':'+i));break;
     }
     case 'prepare':{
      approval();const o=order(cmd.orderId);if(o.outcome!=='RECEIVED')fail('ILLEGAL_ORDER_TRANSITION');
      if(digest(cmd.offer)!==digest(s.candidate.offer))fail('SUPPLIER_DRIFT_REQUALIFICATION_REQUIRED');
      o.order.status='APPROVED';o.order.fulfillmentStatus='PREPARING';o.outcome='PREPARED';o.intentId=digest({workspace:actor.workspace,mission:e.missionId,order:cmd.orderId,offer:cmd.offer});emit('FulfilmentIntent',o.intentId);break;
     }
     case 'intercept':{
      approval();const o=order(cmd.orderId);if(o.outcome!=='PREPARED')fail('INTENT_ALREADY_CONSUMED_OR_UNKNOWN');
      const quantity=sumQuantity(o.order);if(cmd.acceptedQuantity>quantity||cmd.result==='ACCEPTED'&&cmd.acceptedQuantity!==quantity||cmd.result==='PARTIAL'&&(cmd.acceptedQuantity===0||cmd.acceptedQuantity>=quantity)||['TIMEOUT','REJECTED'].includes(cmd.result)&&cmd.acceptedQuantity!==0)fail('INVALID_SUPPLIER_ACK');
      interceptWrite({id:o.intentId!,provider:'CJ',operation:'ORDER',approvalDigest:s.candidateDigest,payloadDigest:digest(o.order)});o.providerId=cmd.providerId;o.accepted=cmd.acceptedQuantity;
      o.outcome=cmd.result==='TIMEOUT'?'UNKNOWN':cmd.result;
      o.order.status=cmd.result==='REJECTED'?'FAILED':'SUBMITTED';o.order.fulfillmentStatus=cmd.result==='REJECTED'?'FAILED':'SUBMITTED';
      emit(cmd.result==='TIMEOUT'?'ExceptionCase':'SupplierReceipt',cmd.orderId+':ack');break;
     }
     case 'reconcile':{
      approval();const o=order(cmd.orderId);if(!['UNKNOWN','RECONCILIATION_REQUIRED','PARTIAL'].includes(o.outcome)||o.providerId!==cmd.providerId)fail('RECONCILIATION_IDENTITY_MISMATCH');
      o.outcome=cmd.result;o.accepted=cmd.result==='ACCEPTED'?sumQuantity(o.order):0;o.order.status=cmd.result==='ACCEPTED'?'SUBMITTED':'FAILED';emit('SupplierReceipt',cmd.receipt);break;
     }
     case 'tracking':{
      approval();const t=cmd.event,o=order(t.orderId);if(o.tracking.includes(t.eventId))fail('DUPLICATE_CALLBACK');
      if(o.providerId!==t.providerId||!['ACCEPTED','PARTIAL','SHIPPED','DELIVERED'].includes(o.outcome))fail('TRACKING_IDENTITY_OR_STATE_INVALID');
      if(Date.parse(t.occurredAt)>now||o.lastTrackingAt&&Date.parse(t.occurredAt)<Date.parse(o.lastTrackingAt))fail('OUT_OF_ORDER_CALLBACK');
      const shipment=o.shipments[t.shipmentId];if(shipment&&(shipment.carrier!==t.carrier||shipment.tracking!==t.tracking||shipment.quantity!==t.quantity))fail('SHIPMENT_IDENTITY_MISMATCH');if(shipment?.delivered&&t.status!=='DELIVERED')fail('DELIVERED_STATE_REGRESSION');if(t.quantity>o.accepted)fail('SHIPMENT_QUANTITY_EXCEEDED');
      if(t.status==='DELIVERED'&&!t.proof)fail('DELIVERY_PROOF_REQUIRED');
      if(t.status==='DELIVERED'&&!shipment)fail('SHIPMENT_REQUIRED');
      o.tracking.push(t.eventId);o.lastTrackingAt=t.occurredAt;
      if(t.status==='SHIPPED'||t.status==='IN_TRANSIT'){o.shipments[t.shipmentId]={quantity:t.quantity,delivered:false,carrier:t.carrier,tracking:t.tracking};o.shipped=Object.values(o.shipments).reduce((n,x)=>n+x.quantity,0);if(o.shipped>o.accepted)fail('SHIPMENT_QUANTITY_EXCEEDED');o.outcome=o.shipped<sumQuantity(o.order)?'PARTIAL':'SHIPPED';o.order.status=o.shipped===sumQuantity(o.order)?'FULFILLED':'SUBMITTED';o.order.fulfillmentStatus='IN_TRANSIT';}
      if(t.status==='DELIVERED'){o.shipments[t.shipmentId]!.delivered=true;o.delivered=Object.values(o.shipments).filter(x=>x.delivered).reduce((n,x)=>n+x.quantity,0);o.outcome=o.delivered===sumQuantity(o.order)?'DELIVERED':'PARTIAL';o.order.status=o.outcome==='DELIVERED'?'DELIVERED':o.shipped===sumQuantity(o.order)?'FULFILLED':'SUBMITTED';o.order.fulfillmentStatus=o.outcome==='DELIVERED'?'DELIVERED':'IN_TRANSIT';}
      if(['LOST','DAMAGED','DELAYED'].includes(t.status))emit('ExceptionCase',t.eventId+':exception');
      emit('Shipment',t.shipmentId);emit('TrackingEvent',t.eventId);break;
     }
     case 'cancel':{
      approval();const o=order(cmd.orderId);if(o.delivered>0||o.outcome==='CANCELLED')fail('RETURN_REQUIRED_OR_ALREADY_CANCELLED');
      if(['UNKNOWN','ACCEPTED','PARTIAL','SHIPPED'].includes(o.outcome)&&!cmd.confirmed){o.outcome='RECONCILIATION_REQUIRED';emit('ExceptionCase',cmd.orderId+':cancel-race');break;}
      o.outcome='CANCELLED';o.order.status='CANCELLED';o.order.fulfillmentStatus='CANCELLED';emit('SupplierReceipt',cmd.orderId+':cancel');break;
     }
     case 'remedy':{
      approval();const o=order(cmd.orderId);if(o.remedies.some(x=>x.id===cmd.caseId))fail('DUPLICATE_REMEDY');
      if(cmd.quantity>sumQuantity(o.order)||cmd.kind==='RETURN'&&(o.delivered===0||o.remedies.filter(r=>r.kind==='RETURN').reduce((n,r)=>n+r.quantity,0)+cmd.quantity>o.delivered))fail('REMEDY_QUANTITY_OR_ELIGIBILITY');
      if(cmd.amount+o.remedies.reduce((n,x)=>n+x.amount,0)>sumQuantity(o.order)*s.candidate.economics.sellingPrice)fail('REFUND_EXPOSURE_EXCEEDED');
      interceptWrite({id:cmd.caseId,provider:cmd.kind==='REFUND'?'AMAZON':'CJ',operation:cmd.kind==='REFUND'?'REFUND':'RETURN',approvalDigest:s.candidateDigest,payloadDigest:digest(cmd)});
      o.remedies.push({id:cmd.caseId,kind:cmd.kind,amount:cmd.amount,quantity:cmd.quantity,financialClass:'SYNTHETIC_EXCLUDED_FROM_ACTUALS'});emit(cmd.kind==='REFUND'?'RefundIntent':cmd.kind==='SUPPLIER_REFUSAL'?'ExceptionCase':'ReturnCase',cmd.caseId);emit('FinancialReference',cmd.caseId+':exposure');break;
     }
     case 'outcome':
      if(!['REVIEWER','OWNER'].includes(actor.role))fail('OUTCOME_REVIEW_REQUIRED');if(!cmd.outcome.verified||!fresh(cmd.outcome.provenance,now))fail('UNVERIFIED_OUTCOME');if(s.outcomes.some(x=>x.id===cmd.outcome.id))fail('DUPLICATE_OUTCOME');s.outcomes.push(cmd.outcome);emit('OutcomeEvidence',cmd.outcome.id);break;
     case 'reverse_outcome':
      if(actor.role!=='OWNER'||!s.outcomes.some(x=>x.id===cmd.target)||s.reversed.includes(cmd.target))fail('INVALID_OUTCOME_REVERSAL');s.reversed.push(cmd.target);emit('OutcomeEvidence',cmd.target+':reversed');break;
     case 'reassess':{
      if(!['PROPOSER','REVIEWER','OWNER'].includes(actor.role))fail('DECISION_ROLE_REQUIRED');
      const outcomes=s.outcomes.filter(x=>x.verified&&!s.reversed.includes(x.id)&&fresh(x.provenance,now));const actions=new Set<string>();
      for(const x of outcomes){if(x.sales===0)actions.add(x.days>=90?'STOP_EXPANSION_REVIEW_PIVOT':'VERIFY_DEMAND_BEFORE_SPEND');if(x.conversion<0.01)actions.add('REVIEW_LISTING_AND_TARGETING');if(x.margin<=0)actions.add('REQUALIFY_ECONOMICS');if(x.stockouts)actions.add('RESEARCH_ALTERNATIVE_SUPPLIER');if(x.deliveryFailures)actions.add('REVIEW_FREIGHT_AND_REMEDIES');if(x.returns)actions.add('REVIEW_QUALITY_AND_RETURN_EXPOSURE');if(x.restricted)actions.add('REJECT_RESTRICTED_MARKET');if(x.cash===null||x.cash<s.qualification.exposure)actions.add('PRESERVE_CAPITAL');}
      if(!outcomes.length)actions.add('INSUFFICIENT_VERIFIED_OUTCOMES');
      s.decisions.push({id:e.id,evidenceIds:outcomes.map(x=>x.id),actions:[...actions],days:outcomes.map(x=>x.days)});emit('StrategyDecision',e.id);break;
     }
    }
   }
   emit('ExecutionReceipt',e.id);
   const body={id:e.id,missionId:e.missionId,workspace:actor.workspace,version:history.length+1,at,actor,command:cmd,requestDigest,previous:last?.digest??'',state:state as unknown as Record<string,unknown>,entities:projectEntities(entities,state!,{workspace:actor.workspace,revision:history.length+1,at,mission:e.missionId,requestId:e.id,previousId:last?.id??null}),classification:'SYNTHETIC' as const,externalEffects:0 as const};
   const receipt={...body,digest:digest(body)};this.store.insert(receipt);return receipt;
  });
 }
}
