import {isolatedFinancialProjection} from './financial-projection.js';
import type {z} from 'zod';
import type {Candidate,CanonicalOrder,Listing,Offer,Outcome,EntityKind,evidenceSchema} from './contracts.js';
import type {CommerceState} from './engine.js';
export type EntityPayloads={
 Opportunity:{productId:string;score:number;qualified:boolean;reasons:string[]};
 ResearchEvidence:z.infer<typeof evidenceSchema>[];
 ProductCandidate:Candidate;
 Product:{productId:string;title:string;category:string};
 SupplierOffer:Offer;
 SupplierSKU:{provider:'CJ';productId:string;sku:string;variantId:string};
 Variant:{productId:string;variantId:string;sku:string};
 InventoryObservation:{variantId:string;warehouseId:string;stock:number;origin:string;observedAt:string;expiresAt:string};
 FreightQuote:{id:string;origin:string;destination:string;variantId:string;amount:number;currency:string;leadDays:number;expiresAt:string};
 EconomicAssessment:CommerceState['qualification']['economics'];
 RiskAssessment:{reasons:string[];exposure:number;review:CommerceState['review']|null};
 Approval:NonNullable<CommerceState['approval']>|{status:'REVOKED_OR_MISSING'};
 ListingPackage:Listing|null;
 MarketplaceIntent:{operation:'VALIDATE_LISTING';listing:Listing|null;digest:string|null;state:'PREPARED';externalEffects:0};
 Order:CanonicalOrder[];
 OrderLine:Array<CanonicalOrder['items'][number]>;
 FulfilmentIntent:Array<{orderId:string;intentId:string|null;state:string;providerId:string|null}>;
 SupplierReceipt:Array<{orderId:string;providerId:string|null;outcome:string;accepted:number}>;
 Shipment:Array<{orderId:string;shipments:CommerceState['orders'][string]['shipments']}>;
 TrackingEvent:{orderId:string;events:string[]}[];
 ReturnCase:CommerceState['orders'][string]['remedies'];
 RefundIntent:CommerceState['orders'][string]['remedies'];
 ExceptionCase:{orderId:string;state:string;remedies:CommerceState['orders'][string]['remedies']}[];
 FinancialReference:ReturnType<typeof isolatedFinancialProjection>;
 StrategyDecision:CommerceState['decisions'];
 OutcomeEvidence:{outcomes:Outcome[];reversedIds:string[]};
 ExecutionReceipt:{requestId:string;externalEffects:0;paidInference:0};
};
export type DomainEntity<K extends EntityKind=EntityKind>={kind:K;id:string;workspace:string;revision:number;createdAt:string;updatedAt:string;correlationId:string;causationId:string|null;approvalRefs:string[];financialRefs:string[];provenance:Offer['provenance'];evidenceAgeMs:number;data:EntityPayloads[K]};
export function projectEntities(refs:Array<{kind:EntityKind;id:string}>,state:CommerceState,meta:{workspace:string;revision:number;at:string;mission:string;requestId:string;previousId:string|null}):DomainEntity[]{
 const c=state.candidate,o=c.offer,orders=Object.entries(state.orders);
 const payloads:EntityPayloads={
 Opportunity:{productId:c.productId,score:state.qualification.score,qualified:state.qualification.qualified,reasons:state.qualification.reasons},ResearchEvidence:c.evidence,ProductCandidate:c,Product:{productId:c.productId,title:c.title,category:c.category},SupplierOffer:o,SupplierSKU:{provider:'CJ',productId:c.productId,sku:o.sku,variantId:o.variantId},Variant:{productId:c.productId,variantId:o.variantId,sku:o.sku},InventoryObservation:{variantId:o.variantId,warehouseId:o.warehouseId,stock:o.stock,origin:o.origin,observedAt:o.provenance.observedAt,expiresAt:o.provenance.expiresAt},FreightQuote:{id:o.quoteId,origin:o.origin,destination:o.destination,variantId:o.variantId,amount:o.freight,currency:o.currency,leadDays:o.leadDays,expiresAt:o.provenance.expiresAt},EconomicAssessment:state.qualification.economics,RiskAssessment:{reasons:state.qualification.reasons,exposure:state.qualification.exposure,review:state.review??null},Approval:state.approval??{status:'REVOKED_OR_MISSING'},ListingPackage:state.listing??null,MarketplaceIntent:{operation:'VALIDATE_LISTING',listing:state.listing??null,digest:state.listingDigest??null,state:'PREPARED',externalEffects:0},Order:orders.map(([,v])=>v.order),OrderLine:orders.flatMap(([,v])=>v.order.items),FulfilmentIntent:orders.map(([id,v])=>({orderId:id,intentId:v.intentId??null,state:v.outcome,providerId:v.providerId??null})),SupplierReceipt:orders.map(([id,v])=>({orderId:id,providerId:v.providerId??null,outcome:v.outcome,accepted:v.accepted})),Shipment:orders.map(([id,v])=>({orderId:id,shipments:v.shipments})),TrackingEvent:orders.map(([id,v])=>({orderId:id,events:v.tracking})),ReturnCase:orders.flatMap(([,v])=>v.remedies.filter(r=>r.kind!=='REFUND')),RefundIntent:orders.flatMap(([,v])=>v.remedies.filter(r=>r.kind==='REFUND')),ExceptionCase:orders.map(([id,v])=>({orderId:id,state:v.outcome,remedies:v.remedies})),FinancialReference:isolatedFinancialProjection(state),StrategyDecision:state.decisions,OutcomeEvidence:{outcomes:state.outcomes,reversedIds:state.reversed},ExecutionReceipt:{requestId:meta.requestId,externalEffects:0,paidInference:0}};
 return refs.map(ref=>({...ref,workspace:meta.workspace,revision:meta.revision,createdAt:meta.at,updatedAt:meta.at,correlationId:meta.mission,causationId:meta.previousId,approvalRefs:state.approval?[state.approval.digest]:[],financialRefs:[c.cash.financialDigest],provenance:o.provenance,evidenceAgeMs:Math.max(0,Date.parse(meta.at)-Date.parse(o.provenance.observedAt)),data:payloads[ref.kind]}));
}
