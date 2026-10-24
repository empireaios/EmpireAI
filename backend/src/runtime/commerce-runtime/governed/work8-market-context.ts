import {verifiedSavedSource,type SavedSourceReader} from './work8-source-projection.js';
import type {Evidence} from '../../../intelligence/model.js';
type Row=Record<string,unknown>;
const row=(v:unknown):Row=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Row:{};
const string=(v:unknown)=>typeof v==='string'&&v.trim()&&v.length<=1500?v.trim():null;
const list=(v:unknown):Row[]=>Array.isArray(v)?v.map(row):[];
const asin=(v:unknown)=>typeof v==='string'&&/^[A-Z0-9]{10}$/.test(v)?v:null;
const market='ATVPDKIKX0DER';
type Saved=ReturnType<typeof verifiedSavedSource>;
export type MarketObservation={asin:string;title:string;brand:string|null;price:number;currency:'USD';priceBasis:'LOWEST_NEW_LANDED_OFFER_OBSERVATION';marketplace:'Amazon US';observedAt:string;expiresAt:string;freshness:'FRESH'|'HISTORICAL';comparisonScope:'BROAD_MARKET_CONTEXT_ONLY';verifiedCandidateMatch:false;unitSales:null;source:{catalogueEvidenceId:string;catalogueDigest:string;offerEvidenceId:string;offerDigest:string};images:never[]};
/** Saved marketplace context is never promoted to a supplier match, competitor range or qualification score. */
export function projectWork8MarketContext(reader:SavedSourceReader,workspace:string,evidenceIds:string[],now:number){
 if(evidenceIds.length>100)throw Error('MARKET_CONTEXT_BATCH_BOUND');
 const rejected:Array<{evidenceId:string;reason:string}>=[],saved:Saved[]=[];
 for(const id of new Set(evidenceIds)){try{const record=verifiedSavedSource(reader,workspace,id,now);if(record.source.provider!=='Amazon'||record.source.subject.marketplace!=='US'||!['amazon.catalog','amazon.offers'].includes(record.source.capabilityId))throw Error('MARKET_CONTEXT_SCOPE_UNSUPPORTED');saved.push(record);}catch(e){rejected.push({evidenceId:id,reason:e instanceof Error?e.message:'MARKET_CONTEXT_INVALID'});}}
 saved.sort((a,b)=>Date.parse(b.source.observedAt)-Date.parse(a.source.observedAt)||a.source.id.localeCompare(b.source.id));
 const catalogues=new Map<string,{source:Evidence;title:string;brand:string|null}>();
 for(const {source} of saved.filter(r=>r.source.capabilityId==='amazon.catalog')){try{
  if(source.endpoint!=='/catalog/2022-04-01/items')throw Error('MARKET_CATALOGUE_ENDPOINT_MISMATCH');
  const response=row(source.facts.response),items=Array.isArray(response.items)?list(response.items):[response];
  if(items.length>10)throw Error('MARKET_CATALOGUE_BOUND');
  const additions:Array<{id:string;source:Evidence;title:string;brand:string|null}>=[];
  for(const item of items){const id=asin(item.asin);if(!id)throw Error('MARKET_ASIN_INVALID');if(!Array.isArray(response.items)&&source.subject.id!==id)throw Error('MARKET_CATALOGUE_IDENTITY_MISMATCH');const summary=list(item.summaries).find(s=>s.marketplaceId===market);const title=string(summary?.itemName);if(!title||title==='[DEPTH_BOUND]')throw Error('MARKET_TITLE_UNAVAILABLE');additions.push({id,source,title,brand:string(summary?.brand)});}
  for(const item of additions)if(!catalogues.has(item.id))catalogues.set(item.id,item);
 }catch(e){rejected.push({evidenceId:source.id,reason:e instanceof Error?e.message:'MARKET_CATALOGUE_INVALID'});}}
 const observations:MarketObservation[]=[],seen=new Set<string>();
 for(const {source} of saved.filter(r=>r.source.capabilityId==='amazon.offers')){try{
  const id=asin(source.subject.id),payload=row(row(source.facts.response).payload),identifier=row(payload.Identifier);
  if(!id||source.endpoint!==`/products/pricing/v0/items/${id}/offers`||payload.ASIN!==id||identifier.ASIN!==id||identifier.MarketplaceId!==market||payload.status!=='Success'||String(payload.ItemCondition).toLowerCase()!=='new'||String(identifier.ItemCondition).toLowerCase()!=='new')throw Error('MARKET_OFFER_IDENTITY_MISMATCH');
  const catalogue=catalogues.get(id);if(!catalogue)throw Error('MARKET_CATALOGUE_LINK_MISSING');
  const prices=list(row(payload.Summary).LowestPrices).filter(p=>String(p.condition).toLowerCase()==='new');if(!prices.length)throw Error('MARKET_PRICE_MISSING');
  const landed=prices.map(p=>row(p.LandedPrice));if(landed.some(p=>p.CurrencyCode!=='USD'||typeof p.Amount!=='number'||!Number.isFinite(p.Amount)||p.Amount<0||!Number.isSafeInteger(Math.round(p.Amount*100))||Math.abs(p.Amount*100-Math.round(p.Amount*100))>1e-7))throw Error('MARKET_PRICE_INVALID');
  const price=Math.min(...landed.map(p=>p.Amount as number));
  if((source.facts.currency!==undefined&&source.facts.currency!=='USD')||(source.facts.price!==undefined&&source.facts.price!==landed[0]!.Amount))throw Error('MARKET_PRICE_CONTRADICTION');
  if(seen.has(id))continue;seen.add(id);
  const expiresAt=Date.parse(source.staleAfter)<=Date.parse(catalogue.source.staleAfter)?source.staleAfter:catalogue.source.staleAfter;
  observations.push({asin:id,title:catalogue.title,brand:catalogue.brand,price,currency:'USD',priceBasis:'LOWEST_NEW_LANDED_OFFER_OBSERVATION',marketplace:'Amazon US',observedAt:source.observedAt,expiresAt,freshness:Date.parse(expiresAt)<=now?'HISTORICAL':'FRESH',comparisonScope:'BROAD_MARKET_CONTEXT_ONLY',verifiedCandidateMatch:false,unitSales:null,source:{catalogueEvidenceId:catalogue.source.id,catalogueDigest:catalogue.source.digest,offerEvidenceId:source.id,offerDigest:source.digest},images:[]});
 }catch(e){rejected.push({evidenceId:source.id,reason:e instanceof Error?e.message:'MARKET_OFFER_INVALID'});}}
 return {observations,rejected,counts:{catalogueProducts:catalogues.size,pricedProducts:observations.length,freshPricedProducts:observations.filter(o=>o.freshness==='FRESH').length},classification:'BROAD_MARKET_CONTEXT_ONLY' as const,verifiedCandidateMatches:0 as const,grantsAuthority:false as const};
}
