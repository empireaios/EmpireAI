import {reviewedDossierFinance} from './work8-dossier-finance.js';
import {digest, type Evidence} from './model.js';
import {verifiedSavedSource, cjVariantCurrencyContract, type SavedSourceReader} from '../runtime/commerce-runtime/governed/work8-source-projection.js';
import type {Row} from './store.js';

export type DossierBinding={candidateId:string;productId:string;subject:Row;evidence:Array<{id:string;envelopeDigest:string}>;snapshotDigest:string};
const object=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const money=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9?v:typeof v==='string'&&/^\d+(\.\d{1,6})?$/.test(v)&&Number(v)<=1e9?Number(v):null;
const text=(v:unknown):string|null=>typeof v==='string'&&v.trim().length>0&&v.length<=1500?v:null;
const findingKinds=['DEMAND','COMPETITION','DIFFERENTIATION','QUALITY','COMPLIANCE','RETURNS','MARKETPLACE'] as const;
/** Projection of server-retained envelopes, never of browser-supplied supplier claims.
 * The digest excludes read time, but includes freshness so expiry invalidates a decision.
 * Facts, model proposals, reviewed inputs and authority deliberately occupy separate fields.
 */
export function qualificationDossier(reader:SavedSourceReader,workspace:string,binding:DossierBinding,now:number,financialSnapshot:Row|null=null){
 if(!workspace||!Number.isFinite(now)||binding.evidence.length>20||binding.evidence.length===0||new Set(binding.evidence.map(e=>e.id)).size!==binding.evidence.length||digest(binding.evidence)!==binding.snapshotDigest)throw Error('DOSSIER_BINDING_INVALID');
 const missing=new Set<string>();
 const sources=binding.evidence.map(pin=>{const {source,freshness}=verifiedSavedSource(reader,workspace,pin.id,now);if(digest(source)!==pin.envelopeDigest)throw Error('DOSSIER_SOURCE_CHANGED');if(freshness!=='FRESH')missing.add('SOURCE_EXPIRED');return {source,freshness};});
 const exact=(capability:string,endpoint:string)=>sources.filter(({source:s})=>s.provider==='CJ'&&s.capabilityId===capability&&s.endpoint===endpoint&&s.subject.id===binding.productId&&s.subject.marketplace===binding.subject.marketplace);
 const details=exact('cj.detail','/product/query');
 const detail=details.length===1?details[0]!.source:null;
 const response=object(detail?.facts.response),request=object(detail?.facts.request);
 const variants=Array.isArray(response.variants)?response.variants:[];
 const selected=variants.filter(v=>object(v).vid===binding.subject.variant&&object(v).pid===binding.productId);
 const identity=!!detail&&response.pid===binding.productId&&request.pid===binding.productId&&selected.length===1;
 const variant=identity?object(selected[0]):{};
 if(!identity)missing.add('EXACT_SUPPLIER_VARIANT_REQUIRED');
 const price=identity?money(variant.variantSellPrice):null;
 const contradiction=[response.currency,variant.currency].some(c=>c!==undefined&&c!==null&&c!=='USD');
 if(contradiction)missing.add('SUPPLIER_CURRENCY_CONTRADICTION');
 if(price===null)missing.add('SUPPLIER_PRICE_REQUIRED');
 const stockSources=exact('cj.stock','/product/stock/queryByVid').filter(({source:s})=>s.subject.variant===binding.subject.variant&&object(s.facts.request).vid===binding.subject.variant);
 const stockRows=stockSources.length===1&&Array.isArray(stockSources[0]!.source.facts.response)?stockSources[0]!.source.facts.response as unknown[]:[];
 // Never sum unrelated countries/warehouses or choose the first ambiguous stock row.
 const stockMatches=stockRows.map(object).filter(r=>r.vid===binding.subject.variant&&r.countryCode==='CN');
 const stock=stockMatches.length===1&&Number.isSafeInteger(stockMatches[0]!.storageNum)&&stockMatches[0]!.storageNum>=0?stockMatches[0]!.storageNum as number:null;
 if(stock===null)missing.add('EXACT_STOCK_REQUIRED');else if(stock===0)missing.add('OUT_OF_STOCK');
 const freightSources=exact('cj.freight','/logistic/freightCalculate').filter(({source:s})=>{const r=object(s.facts.request);return s.subject.variant===binding.subject.variant&&s.subject.destination===binding.subject.destination&&r.startCountryCode==='CN'&&r.endCountryCode===binding.subject.destination&&Array.isArray(r.products)&&r.products.length===1&&r.products[0]?.vid===binding.subject.variant&&r.products[0]?.quantity===1;});
 const freightRows=freightSources.length===1&&Array.isArray(freightSources[0]!.source.facts.response)?freightSources[0]!.source.facts.response as unknown[]:[];
 const freight=freightRows.length===1?object(freightRows[0]):{};
 const freightAmount=money(freight.logisticPrice);
 // Product price documentation is not a currency contract for a freight response.
 const freightCurrency=typeof freight.currency==='string'&&/^[A-Z]{3}$/.test(freight.currency)?freight.currency:null;
 if(freightAmount===null)missing.add('EXACT_FREIGHT_REQUIRED');if(freightCurrency===null)missing.add('FREIGHT_CURRENCY_REQUIRED');
 const images=[...new Set([response.productImage,...(Array.isArray(response.productImageSet)?response.productImageSet:[]),variant.variantImage].filter((u):u is string=>{try{const p=new URL(String(u));return p.protocol==='https:'&&!p.username&&!p.password;}catch{return false;}}))].slice(0,10).map(url=>({observedUrl:url,displayUrl:null,rights:'UNVERIFIED' as const,permissionEvidence:null}));
 missing.add('IMAGE_PERMISSION_REQUIRED');missing.add('REVIEWED_FINANCIAL_INPUTS_REQUIRED');missing.add('REVIEWED_ELIGIBILITY_REQUIRED');missing.add('PILLOW_COMPLETED_ASSESSMENT_REQUIRED');missing.add('EXPLICIT_SIMULATION_AUTHORIZATION_REQUIRED');
 const body={schema:'WORK8_QUALIFICATION_DOSSIER_V1',workspace,candidateId:binding.candidateId,sourceBinding:binding,
  sourceEvidence:sources.map(({source:s,freshness})=>({id:s.id,envelopeDigest:digest(s),factsDigest:s.digest,provider:s.provider,capability:s.capabilityId,endpoint:s.endpoint,observedAt:s.observedAt,expiresAt:s.staleAfter,freshness,classification:'RETAINED_PROVIDER_OBSERVATION'})),
  supplier:{productId:binding.productId,variantId:identity?binding.subject.variant:null,destination:binding.subject.destination??null,identityVerified:identity,title:identity?text(response.productNameEn):null,price:contradiction?null:price,currency:price!==null&&!contradiction?'USD':null,currencyBasis:price!==null&&!contradiction?cjVariantCurrencyContract:null,stock,freight:{amount:freightAmount,currency:freightCurrency,service:text(freight.logisticName),leadTime:text(freight.logisticAging)},images},
  financialInputs:reviewedDossierFinance(workspace,binding.productId,binding.subject.destination,financialSnapshot,now),
  findings:findingKinds.map(kind=>({kind,status:'MISSING_REVIEWED_EVIDENCE',value:null,sourceIds:[],verified:false})),
  eligibility:{status:'DEFERRED',qualified:false,missing:[...missing].sort()},
  modelProposal:null,ownerApproval:null,simulationEnrollment:null,grantsAuthority:false,externalEffects:0,paidInference:0};
 return {...body,digest:digest(body)};
}
