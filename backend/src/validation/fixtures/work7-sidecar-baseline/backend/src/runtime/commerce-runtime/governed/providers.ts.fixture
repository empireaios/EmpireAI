import {z} from 'zod';
import {digest} from './store.js';
export const providerRequestSchema=z.object({provider:z.enum(['CJ','AMAZON']),operation:z.enum(['CATALOGUE','PRODUCT','VARIANT','INVENTORY','FREIGHT','MARKETPLACE','REQUIREMENTS','FEES','ORDERS']),productId:z.string().max(100).optional(),variantId:z.string().max(100).optional(),marketplaceId:z.string().max(50).optional(),destination:z.string().length(2).optional(),origin:z.string().length(2).optional(),page:z.number().int().min(1).max(5).default(1),nextToken:z.string().max(2000).optional()}).strict();
export type ProviderRequest=z.infer<typeof providerRequestSchema>;
export type ProviderReceipt={provider:string;operation:string;classification:'REAL_READ_ONLY'|'SYNTHETIC';status:string;observedAt:string;requestDigest:string;responseDigest:string|null;items:unknown[];nextToken:string|null;complete:boolean;retryAfterMs:number;externalEffects:0};
export function classifyProvider(status:number){return status===401?'AUTHENTICATION_DENIED':status===403?'PERMISSION_DENIED':status===429?'RATE_LIMITED':status>=500?'PROVIDER_UNAVAILABLE':status>=400?'REQUEST_REJECTED':'READ_VERIFIED';}
const schema=z.object({items:z.array(z.unknown()).max(100),nextToken:z.string().max(2000).nullable(),complete:z.boolean()}).strict();
/** Transport injected at the read boundary. No caller supplies URL, headers or a write operation. */
export class GovernedProviderReads {
 private cooldown=new Map<string,number>();
 constructor(private transport:(r:ProviderRequest)=>Promise<{status:number;body:unknown}>,private classification:'REAL_READ_ONLY'|'SYNTHETIC',private clock:()=>number=Date.now){}
 async read(raw:unknown):Promise<ProviderReceipt>{const r=providerRequestSchema.parse(raw),now=this.clock();const base={provider:r.provider,operation:r.operation,classification:this.classification,observedAt:new Date(now).toISOString(),requestDigest:digest(r),responseDigest:null,items:[],nextToken:null,complete:false,retryAfterMs:0,externalEffects:0 as const};
  if((this.cooldown.get(r.provider)??0)>now)return {...base,status:'COOLDOWN',retryAfterMs:this.cooldown.get(r.provider)!-now};
  try{const result=await this.transport(r);const status=classifyProvider(result.status);if(status!=='READ_VERIFIED'){const delay=result.status===429?60000:result.status>=500?30000:0;if(delay)this.cooldown.set(r.provider,now+delay);return {...base,status,retryAfterMs:delay};}
   const b=schema.parse(result.body);if(b.nextToken&&b.complete)throw Error('PAGINATION_CONTRADICTION');return {...base,...b,status,responseDigest:digest(b)};
  }catch(e){const status=e instanceof z.ZodError?'SCHEMA_MISMATCH':e instanceof Error&&['PERMISSION_DENIED','POINT_AUTHORITY_REQUIRED','UNCOMMISSIONED','MISSING_SKU','UNSUPPORTED_READ'].includes(e.message)?e.message:'READ_TIMEOUT_OR_TRANSPORT_FAILURE';this.cooldown.set(r.provider,now+30000);return {...base,status,retryAfterMs:30000};}
 }
}
export const writeIntentSchema=z.object({id:z.string().min(1).max(160),provider:z.enum(['CJ','AMAZON']),operation:z.enum(['ORDER','CANCEL','RETURN','PUBLISH','PRICE','INVENTORY','ACKNOWLEDGE','SHIPMENT','REFUND']),approvalDigest:z.string().regex(/^[a-f0-9]{64}$/),payloadDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
/** Deliberately has no network transport or credential reference. Production writes never reach provider SDKs. */
export function interceptWrite(input:unknown){const intent=writeIntentSchema.parse(input);return {intent,receiptId:digest(intent),status:'INTERCEPTED',classification:'SYNTHETIC',externalEffects:0,birth:'NOT_BORN',commerce:'LOCKED'};}
