import { z } from 'zod';
import { orderSchema } from '../../../orders/models/order.js';
import { economicsSchema } from '../../../finance/financial-centre.js';

export const id = z.string().regex(/^[A-Za-z0-9_.:-]{1,160}$/);
const date = z.string().datetime({offset:true});
const amount = z.number().finite().nonnegative().max(1e9);
export const provenanceSchema = z.object({source:id,reference:z.string().min(1).max(500),sha256:z.string().regex(/^[a-f0-9]{64}$/),observedAt:date,expiresAt:date,classification:z.enum(['REAL_READ_ONLY','SYNTHETIC','ESTIMATED','UNKNOWN'])}).strict();
export const evidenceSchema = z.object({id,kind:z.enum(['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE','PAYMENT','DELIVERY']),value:z.number().finite().min(0).max(100).nullable(),verified:z.boolean(),provenance:provenanceSchema}).strict();
export const offerSchema = z.object({provider:z.literal('CJ'),productId:id,variantId:id,sku:id,warehouseId:id,origin:z.string().length(2),destination:z.string().length(2),stock:z.number().int().nonnegative(),price:amount,freight:amount,currency:z.string().length(3),leadDays:z.number().int().min(1).max(180),quoteId:id,provenance:provenanceSchema}).strict();
export const candidateSchema = z.object({productId:id,title:z.string().min(3).max(200),category:id,restricted:z.boolean(),offer:offerSchema,evidence:z.array(evidenceSchema).min(1).max(40),economics:economicsSchema,cash:z.object({available:amount.nullable(),liabilities:amount.nullable(),committed:amount,budget:amount,fxVerified:z.boolean(),financialDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict()}).strict();
export const listingSchema = z.object({productId:id,title:z.string().min(3).max(200),bullets:z.array(z.string().min(3).max(500)).min(1).max(5),description:z.string().min(10).max(3000),category:id,attributes:z.record(z.string().max(300)),variants:z.array(z.object({sku:id,variantId:id,dimensions:z.string().min(1).max(200)}).strict()).min(1).max(100),images:z.array(z.object({url:z.string().url(),license:z.string().min(3).max(500),rightsEvidence:id,sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict()).min(1).max(9),claims:z.array(z.object({text:z.string().max(300),evidenceId:id}).strict()).max(20),sourceEvidence:z.array(id).min(1).max(40)}).strict();
export const trackingSchema = z.object({eventId:id,orderId:id,shipmentId:id,providerId:id,carrier:id,tracking:id,quantity:z.number().int().positive(),status:z.enum(['SHIPPED','IN_TRANSIT','DELIVERED','DELAYED','LOST','DAMAGED']),occurredAt:date,proof:z.string().max(500).optional()}).strict();
export const outcomeSchema = z.object({id,verified:z.boolean(),days:z.union([z.literal(30),z.literal(60),z.literal(90)]),sales:z.number().int().nonnegative(),conversion:z.number().min(0).max(1),margin:z.number().finite(),stockouts:z.number().int().nonnegative(),deliveryFailures:z.number().int().nonnegative(),returns:z.number().int().nonnegative(),restricted:z.boolean(),cash:amount.nullable(),provenance:provenanceSchema}).strict();
export const entityKinds = ['Opportunity','ResearchEvidence','ProductCandidate','Product','SupplierOffer','SupplierSKU','Variant','InventoryObservation','FreightQuote','EconomicAssessment','RiskAssessment','Approval','ListingPackage','MarketplaceIntent','Order','OrderLine','FulfilmentIntent','SupplierReceipt','Shipment','TrackingEvent','ReturnCase','RefundIntent','ExceptionCase','FinancialReference','StrategyDecision','OutcomeEvidence','ExecutionReceipt'] as const;
export type EntityKind = typeof entityKinds[number];
export type Candidate = z.infer<typeof candidateSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type Listing = z.infer<typeof listingSchema>;
export type Outcome = z.infer<typeof outcomeSchema>;
export type CanonicalOrder = z.infer<typeof orderSchema>;
export const actorSchema=z.object({id,workspace:id,role:z.enum(['OWNER','PROPOSER','REVIEWER','EXECUTOR'])}).strict();
export type Actor=z.infer<typeof actorSchema>;
export const commandSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('research'),candidate:candidateSchema}).strict(),
 z.object({type:z.literal('review'),digest:z.string().length(64),decision:z.enum(['APPROVE','REJECT']),reason:z.string().min(3).max(1000)}).strict(),
 z.object({type:z.literal('approve'),digest:z.string().length(64),expiresAt:date,maxExposure:amount}).strict(),
 z.object({type:z.literal('revoke'),reason:z.string().min(3).max(1000)}).strict(),
 z.object({type:z.literal('listing'),listing:listingSchema}).strict(),
 z.object({type:z.literal('intake'),order:orderSchema,paymentEvidence:id}).strict(),
 z.object({type:z.literal('prepare'),orderId:id,offer:offerSchema}).strict(),
 z.object({type:z.literal('intercept'),orderId:id,result:z.enum(['ACCEPTED','REJECTED','TIMEOUT','PARTIAL']),acceptedQuantity:z.number().int().nonnegative(),providerId:id}).strict(),
 z.object({type:z.literal('reconcile'),orderId:id,providerId:id,result:z.enum(['ACCEPTED','REJECTED']),receipt:id}).strict(),
 z.object({type:z.literal('tracking'),event:trackingSchema}).strict(),
 z.object({type:z.literal('cancel'),orderId:id,confirmed:z.boolean()}).strict(),
 z.object({type:z.literal('remedy'),orderId:id,caseId:id,kind:z.enum(['RETURN','REFUND','REPLACEMENT','SUPPLIER_REFUSAL']),amount,quantity:z.number().int().positive(),reason:z.string().min(3).max(500)}).strict(),
 z.object({type:z.literal('outcome'),outcome:outcomeSchema}).strict(),
 z.object({type:z.literal('reverse_outcome'),target:id,reason:z.string().min(3).max(500)}).strict(),
 z.object({type:z.literal('reassess')}).strict(),
]);
export type Command=z.infer<typeof commandSchema>;
export const envelopeSchema=z.object({id,missionId:id,expectedVersion:z.number().int().nonnegative(),command:commandSchema}).strict();
