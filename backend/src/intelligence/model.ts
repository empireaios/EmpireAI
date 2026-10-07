import {z} from 'zod';
import {createHash} from 'node:crypto';
export const key=z.string().min(1).max(160).regex(/^[A-Za-z0-9_.:-]+$/);
export const eyes=['MARKET','SUPPLIER','INTERNET','EMPIRE'] as const;
export const digest=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export const subjectSchema=z.object({id:key,variant:key.optional(),marketplace:z.enum(['US','SG','UK','DE','GLOBAL']).default('US'),destination:z.string().regex(/^[A-Z]{2}$/).optional(),query:z.string().min(1).max(120).optional()}).strict();
export const jobSchema=z.object({id:key,objective:z.string().min(4).max(800),capabilities:z.array(key).min(1).max(4),subject:subjectSchema,requestLimit:z.number().int().min(1).max(12).default(6),strategyRef:key.optional(),evidenceRefs:z.array(key).max(12).default([])}).strict();
export type JobInput=z.infer<typeof jobSchema>;
export type Eye=typeof eyes[number];
export type Authenticity='LIVE_PROVIDER'|'INTERNAL_UNVERIFIED'|'SYNTHETIC';
export type Evidence={id:string;capabilityId:string;eye:Eye;provider:string;endpoint:string;subject:z.infer<typeof subjectSchema>;observedAt:string;retrievedAt:string;staleAfter:string;authenticity:Authenticity;digest:string;facts:Record<string,unknown>;jobId:string;quality:string[];lineage:string[];grantsAuthority:false};
export type Capability={id:string;eye:Eye;provider:string;purpose:string;implemented:boolean;credentials:string[];ttlMs:number;cadenceMs:number;cost:{model:string;recurringUsd:number|null;perRequestUsd:number|null;units:number};limits:string;strengths:string[];limitations:string[];dependencies:string[];technicalWriteCapability:string;authority:'READ_ONLY';priority:string;strategyRef:string|null};
const hour=3600000;
function cap(id:string,eye:Eye,provider:string,purpose:string,credentials:string[],units=0,implemented=true,priority='ESSENTIAL_NOW'):Capability{return {id,eye,provider,purpose,credentials,implemented,ttlMs:6*hour,cadenceMs:6*hour,cost:{model:provider==='CJ'?'CJ points; no automatic purchase':provider==='Keepa'?'Monthly API token subscription':provider==='Amazon'?'Existing SP-API account; account/API charges unverified':'Existing infrastructure; marginal hosting unallocated',recurringUsd:null,perRequestUsd:null,units},limits:'One page, <=10 items, <=2 MiB, 15s/request, no inline retries; daily provider quota enforced',strengths:[purpose],limitations:['Endpoint verification establishes only the named read scope','No inference of write authority or guaranteed demand/profit'],dependencies:credentials,technicalWriteCapability:credentials.length?'UNKNOWN; credentials may permit more than this adapter':'NONE',authority:'READ_ONLY',priority,strategyRef:null};}
const amz=['AMAZON_SP_API_CLIENT_ID','AMAZON_SP_API_CLIENT_SECRET','AMAZON_SP_API_REFRESH_TOKEN'];
export const capabilities:Capability[]=[
 cap('amazon.account','MARKET','Amazon','Seller marketplace participation',amz),
 cap('amazon.catalog','MARKET','Amazon','Product discovery, identifiers, dimensions and sales rank proxy',amz),
 cap('amazon.offers','MARKET','Amazon','Competitive offers and price evidence for one ASIN',amz),
 cap('amazon.fees','MARKET','Amazon','Read-only fee estimate; requires actual price operands',amz,0,false,'HIGH_VALUE_NOW'),
 cap('amazon.analytics','MARKET','Amazon','Existing Brand Analytics reports; eligibility must be proved',amz),
 cap('amazon.restrictions','MARKET','Amazon','Listing eligibility requires seller identifier and category context',amz,0,false),
 cap('amazon.advertising','MARKET','Amazon Ads','Read-only advertising performance; separate Ads access needed',[],0,false,'USEFUL_LATER'),
 cap('amazon.opportunity','MARKET','Amazon','Product Opportunity Explorer; human dashboard eligibility not API verification',[],0,false,'HIGH_VALUE_NOW'),
 cap('cj.catalog','SUPPLIER','CJ','Independent sourcing discovery; supplier popularity is not demand',['CJ_API_KEY'],50),
 cap('cj.detail','SUPPLIER','CJ','Product variants, sourcing price and metadata',['CJ_API_KEY'],10),
 cap('cj.stock','SUPPLIER','CJ','Variant warehouse stock and origin geography',['CJ_API_KEY'],10),
 cap('cj.freight','SUPPLIER','CJ','Variant freight and delivery estimate to named destination',['CJ_API_KEY'],10),
 cap('keepa.history','MARKET','Keepa','Historical prices, ranks, seasonality and offer changes',['KEEPA_API_KEY'],1,true,'HIGH_VALUE_NOW'),
 cap('internet.research','INTERNET','Public sources','Bounded official public research; source text is untrusted evidence',[]),
 cap('internet.safety','INTERNET','CPSC','Product recall and hazard research; absence is not a safety clearance',[]),
 cap('internet.trends','INTERNET','Google Trends','Search-interest proxy; API alpha access required',[],0,false,'HIGH_VALUE_NOW'),
 cap('internet.reviews','INTERNET','Public sources','Customer pain and review evidence; approved API or owner export needed',[],0,false,'HIGH_VALUE_NOW'),
 cap('empire.state','EMPIRE','EmpireAI','Current locked runtime, stored accounting and evidence without commerce claims',[]),
];
export const publicSources={
 'amazon-analytics':'https://developer-docs.amazon.com/sp-api/docs/report-type-values-analytics',
 'cj-logistics':'https://developers.cjdropshipping.com/en/api/api2/api/logistic.html',
 'keepa-history':'https://keepa.com/api-docs/plans-tokens.html',
 'trends-access':'https://developers.google.com/search/apis/trends',
} as const;
export const strategySchema=z.object({id:key,version:z.number().int().positive(),minDimensions:z.number().int().min(2).max(8),priceChangePct:z.number().min(1).max(100),maxShortlist:z.number().int().min(1).max(20),explorationShare:z.number().min(0).max(1)}).strict();
export const defaultStrategy=strategySchema.parse({id:'balanced-discovery',version:1,minDimensions:5,priceChangePct:15,maxShortlist:10,explorationShare:.2});
