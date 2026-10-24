import {digest, type Evidence} from '../../../intelligence/model.js';

/** Server-owned reader must be scoped to the authenticated workspace; never accept evidence bodies from a browser. */
export type SavedSourceReader = (workspace: string, evidenceId: string) => Evidence | null;
type RecordValue = Record<string, unknown>;
export const cjVariantCurrencyContract={currency:'USD',endpoint:'/product/query',field:'variants[].variantSellPrice',source:'https://developers.cjdropshipping.com/en/api/api2/api/product.html',section:'1.5 Product Details(GET) / Variant',verifiedAt:'2026-10-10T21:42:51Z'} as const;
const object = (v: unknown): RecordValue => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as RecordValue : {};
const text = (v: unknown) => typeof v === 'string' && v.trim() && v.length <= 1500 ? v.trim() : null;
const money = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : typeof v === 'string' && /^\d+(\.\d{1,6})?$/.test(v) && Number.isFinite(Number(v)) ? Number(v) : null;
const https = (v: unknown) => {try {const u=new URL(String(v));return u.protocol==='https:' && !u.username && !u.password ? u.href : null;}catch{return null;}};
export function verifiedSavedSource(reader: SavedSourceReader, workspace: string, id: string, now: number) {
 const source=reader(workspace,id);
 if(!source || source.id!==id || source.authenticity!=='LIVE_PROVIDER' || source.grantsAuthority!==false || source.digest!==digest(source.facts)) throw Error('SOURCE_NOT_AUTHENTIC');
 const observed=Date.parse(source.observedAt),retrieved=Date.parse(source.retrievedAt),expires=Date.parse(source.staleAfter);
 if(!Number.isFinite(now)||![observed,retrieved,expires].every(Number.isFinite)||observed>retrieved||retrieved>now||expires<=retrieved) throw Error('SOURCE_CHRONOLOGY_INVALID');
 return {source,freshness:expires<=now?'HISTORICAL' as const:'FRESH' as const};
}

/** No refresh, network, inference, commerce effect or fallback fixtures. A catalogue query subject is not a product identity. */
export function projectWork8Sources(reader: SavedSourceReader, workspace: string, evidenceIds: string[], now: number) {
 if(evidenceIds.length>100)throw Error('SOURCE_BATCH_BOUND');
 const products: Array<{
  candidateId:string; productId:string; variantId:string|null; title:string|null; category:string|null;
  supplier:string; supplierId:string|null; supplierName:string|null; observedPrice:number|null; currency:string|null; currencyBasis:typeof cjVariantCurrencyContract|string|null; observedAt:string; freshness:'FRESH'|'HISTORICAL';
  observedVariants:Array<{variantId:string;title:string|null;observedPrice:number;currency:'USD';currencyBasis:typeof cjVariantCurrencyContract}>;
  images:Array<{observedUrl:string;displayUrl:null;rights:'UNVERIFIED'}>; source:{evidenceId:string;digest:string;endpoint:string};
  authenticity:'REAL_READ_ONLY'; downstream:'SIMULATED_ONLY'; screening:'DEFERRED'; reasons:string[];
  stock:null; leadTime:null; shipping:null; competitorPrices:never[]; pillowAssessment:null;
 }>=[];
 const rejected:Array<{evidenceId:string;reason:string}>=[];
 const seen=new Set<string>();
 for(const id of new Set(evidenceIds)){
  try{
   const {source,freshness}=verifiedSavedSource(reader,workspace,id,now);
   if(source.provider!=='CJ'||!['cj.catalog','cj.detail'].includes(source.capabilityId))throw Error('SOURCE_SCOPE_UNSUPPORTED');
   const response=object(source.facts.response);
   if(source.endpoint!==(source.capabilityId==='cj.catalog'?'/product/list':'/product/query'))throw Error('SOURCE_ENDPOINT_MISMATCH');
   const rows=source.capabilityId==='cj.catalog'?response.list:[response];
   if(!Array.isArray(rows)||rows.length>10)throw Error('SOURCE_SHAPE_UNSUPPORTED');
   for(const raw of rows){
    const row=object(raw),pid=text(row.pid);
    if(!pid || !/^[A-Za-z0-9_.:-]{1,160}$/.test(pid)) {rejected.push({evidenceId:id,reason:'PRODUCT_ID_MISSING'});continue;}
    if(source.capabilityId==='cj.detail' && (source.subject.id!==pid || object(source.facts.request).pid!==pid))throw Error('PRODUCT_ID_MISMATCH');
    const variants=Array.isArray(row.variants)?row.variants:[];
    const selected=source.subject.variant ? variants.filter(v=>object(v).vid===source.subject.variant) : [];
    if(source.subject.variant && selected.length!==1)throw Error('VARIANT_ID_MISMATCH');
    const variant=object(selected[0]);
    const variantId=source.subject.variant??null;
    if(variantId && variant.pid!==pid)throw Error('VARIANT_PARENT_MISMATCH');
    if(source.capabilityId==='cj.detail'&&variants.map(object).some(v=>v.pid===pid&&money(v.variantSellPrice)!==null&&((v.currency!==undefined&&v.currency!==null&&v.currency!=='USD')||(row.currency!==undefined&&row.currency!==null&&row.currency!=='USD'))))throw Error('SOURCE_CURRENCY_CONTRADICTION');
    const observedVariants=source.capabilityId==='cj.detail'?variants.map(object).filter(v=>v.pid===pid&&typeof v.vid==='string'&&/^[A-Za-z0-9_.:-]{1,160}$/.test(v.vid)&&money(v.variantSellPrice)!==null&&(!v.currency||v.currency==='USD')).filter((v,i,all)=>all.findIndex(x=>x.vid===v.vid)===i).slice(0,10).map(v=>({variantId:String(v.vid),title:text(v.variantNameEn),observedPrice:money(v.variantSellPrice)!,currency:'USD' as const,currencyBasis:cjVariantCurrencyContract})):[];
    const candidateId='CJ:'+pid+':'+(variantId??'UNSELECTED');
    if(seen.has(candidateId))continue;
    const price=money(variantId?variant.variantSellPrice:row.sellPrice);
    const currencyRaw=text(variant.currency??row.currency);
    const explicitCurrency=currencyRaw&&/^[A-Z]{3}$/.test(currencyRaw)?currencyRaw:null;
    const contract=source.capabilityId==='cj.detail'&&variantId&&price!==null?cjVariantCurrencyContract:null;
    if(contract&&explicitCurrency&&explicitCurrency!==contract.currency)throw Error('SOURCE_CURRENCY_CONTRADICTION');
    const currency=explicitCurrency??contract?.currency??null;
    const currencyBasis=explicitCurrency?'SOURCE_RESPONSE':contract;
    const urls=[row.productImage,...(Array.isArray(row.productImageSet)?row.productImageSet:[]),...(variantId?[variant.variantImage]:[])];
    const images=[...new Set(urls.map(https).filter((u):u is string=>u!==null))].slice(0,10).map(observedUrl=>({observedUrl,displayUrl:null,rights:'UNVERIFIED' as const}));
    const reasons=['MEDIA_USAGE_RIGHTS_UNVERIFIED','INDEPENDENT_ELIGIBILITY_AND_ECONOMICS_REQUIRED','PILLOW_ASSESSMENT_NOT_LINKED'];
    if(freshness==='HISTORICAL')reasons.push('SOURCE_EXPIRED');
    if(price===null)reasons.push('PRICE_UNKNOWN');
    if(currency===null)reasons.push('CURRENCY_UNKNOWN');
    if(!variantId)reasons.push('VARIANT_NOT_SELECTED');
    seen.add(candidateId);
    products.push({candidateId,productId:pid,variantId,title:text(row.productNameEn),category:text(row.categoryName),supplier:'CJ',supplierId:text(row.supplierId),supplierName:text(row.supplierName),observedPrice:price,currency,currencyBasis,observedAt:source.observedAt,freshness,observedVariants,images,source:{evidenceId:id,digest:source.digest,endpoint:source.endpoint},authenticity:'REAL_READ_ONLY',downstream:'SIMULATED_ONLY',screening:'DEFERRED',reasons,stock:null,leadTime:null,shipping:null,competitorPrices:[],pillowAssessment:null});
   }
  }catch(error){rejected.push({evidenceId:id,reason:error instanceof Error?error.message:'SOURCE_INVALID'});}
 }
 return {products,rejected,counts:{actualSourceProducts:products.length,observedVariants:products.reduce((n,p)=>n+p.observedVariants.length,0),variantPricesWithDocumentedCurrency:products.reduce((n,p)=>n+p.observedVariants.length,0),sourceIdentityMatches:products.length,observedImages:products.reduce((n,p)=>n+p.images.length,0),validImagesWithRights:0,pricesWithCurrency:products.filter(p=>p.observedPrice!==null&&p.currency!==null).length,softwareScreened:products.length,qualified:0,pillowAssessments:0,ownerRecommendations:0},grantsAuthority:false as const};
}
