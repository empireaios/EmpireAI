/** One observed PID, at most two GETs and one non-mutating freight calculation. */
import {createHash} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {configuration,request,save} from './provider-readback.mjs';
export const PID='2609291119211612600';
const BASE='https://developers.cjdropshipping.com/api2.0/v1';
const hash=x=>createHash('sha256').update(x).digest('hex');
const text=x=>typeof x==='string'&&x.length<=300?x:null;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9{}-]{1,80}$/.test(x)?x:null;
const units=x=>Number.isSafeInteger(x)&&x>=0?x:null;
export function cents(x) {
  if(!['number','string'].includes(typeof x)||! /^(0|[1-9]\d{0,7})(\.\d{1,2})?$/.test(String(x)))return null;
  const [whole,fraction='']=String(x).split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));
}
function rows(x,max=1000){if(!Array.isArray(x)||x.length>max)throw Error('CJ_ARRAY_SCHEMA');return x;}
export function productSummary(data){
  if(data?.pid!==PID)throw Error('CJ_PID_MISMATCH');
  const variants=rows(data.variants).map(v=>{
    if(v.pid!==PID||!id(v.vid))throw Error('CJ_VARIANT_IDENTITY_MISMATCH');
    return {vid:v.vid,pid:v.pid,sku:text(v.variantSku),name:text(v.variantNameEn),
      variantSellPrice:v.variantSellPrice===null?null:['number','string'].includes(typeof v.variantSellPrice)?v.variantSellPrice:null,
      priceWireType:typeof v.variantSellPrice,costCents:cents(v.variantSellPrice)};
  });
  if(new Set(variants.map(v=>v.vid)).size!==variants.length)throw Error('CJ_DUPLICATE_VARIANT');
  return {pid:PID,sku:text(data.productSku),name:text(data.productNameEn),productType:text(data.productType),variants};
}
export function inventorySummary(data){return {variantInventories:rows(data?.variantInventories).map(v=>{
  if(!id(v.vid))throw Error('CJ_STOCK_IDENTITY_MISMATCH');
  return {vid:v.vid,inventory:rows(v.inventory,100).map(w=>({countryCode:/^[A-Z]{2}$/.test(w.countryCode)?w.countryCode:null,
    cjInventory:units(w.cjInventory),factoryInventory:units(w.factoryInventory),totalInventory:units(w.totalInventory),
    stock:w.stock==null?null:rows(w.stock,100).map(s=>({stockId:id(s.stockId),inventory:units(s.inventory),factoryInventory:units(s.factoryInventory)}))}))};
})};}
export function choose(product,inventory){
  const candidates=[];
  for(const v of product.variants){
    if(!v.sku||!(v.costCents>0))continue;
    const matches=inventory.variantInventories.filter(s=>s.vid===v.vid);if(matches.length!==1)continue;
    for(const w of matches[0].inventory){
      if(!['CN','US'].includes(w.countryCode)||!(w.cjInventory>0)||!w.stock?.length)continue;
      if(new Set(w.stock.map(s=>s.stockId)).size!==w.stock.length||w.stock.some(s=>!s.stockId||s.inventory===null)||w.stock.reduce((a,s)=>a+s.inventory,0)!==w.cjInventory)continue;
      for(const s of w.stock)if(s.inventory>0)candidates.push({vid:v.vid,sku:v.sku,costCents:v.costCents,countryCode:w.countryCode,stockId:s.stockId,cjUnits:s.inventory});
    }
  }
  return candidates.sort((a,b)=>a.vid.localeCompare(b.vid)||a.countryCode.localeCompare(b.countryCode)||a.stockId.localeCompare(b.stockId))[0]??null;
}
function freightSummary(data){return {options:rows(data,100).map(o=>({logisticName:text(o.logisticName),logisticAging:text(o.logisticAging),
  logisticPriceCents:cents(o.logisticPrice),taxesFeeCents:cents(o.taxesFee),clearanceOperationFeeCents:cents(o.clearanceOperationFee),totalPostageFeeCents:cents(o.totalPostageFee)}))};}
export async function runSupplierReadback(env,dir,{testTransport}={}){
  if(env.CJ_SUPPLIER_POINT_LIMIT!=='30'||env.CJ_CREDENTIAL_MODE!=='MCP_DIRECT')throw Error('CJ_FIXED_30_POINT_DIRECT_BOUND_REQUIRED');
  const config=configuration({...env,READBACK_PROVIDER:'cj',CJ_READBACK_POINT_LIMIT:'50'});
  mkdirSync(dir,{mode:0o700});
  const evidence={schemaVersion:1,sourceHead:env.GITHUB_SHA??null,provider:'cj',pid:PID,
    evidenceMode:testTransport?'OFFLINE_TEST':'AUTHENTICATED_HTTP_OBSERVATION',status:'STARTED',startedAt:new Date().toISOString(),
    maxRequests:3,maximumPoints:30,requestsAttempted:0,pointsReserved:0,retries:0,businessWrites:0,
    destination:{country:'US',zip:null,scope:'COUNTRY_ONLY_NOT_CUSTOMER_ADDRESS'},
    authority:{birth:'NOT_BORN',commerce:'LOCKED'},receipts:[],actualEconomics:null,qualificationAllowed:false,accountIdentityConfirmed:false};
  save(dir,'admission.json',evidence);
  async function observe(path,method,body,summarize){
    if(evidence.requestsAttempted>=3)throw Error('REQUEST_BOUND_EXCEEDED');
    const spec={url:BASE+path,method};const n=++evidence.requestsAttempted;evidence.pointsReserved+=10;
    save(dir,`request-${n}.json`,{...spec,body:body??null,pointsReserved:10,attempt:n});
    // CJ free-tier limit is one request/second; this is pacing, never a retry.
    if(n>1&&!testTransport)await new Promise(resolve=>setTimeout(resolve,1100));
    const result=await request(spec,{'CJ-Access-Token':config.directToken,'content-type':'application/json'},body?JSON.stringify(body):undefined,testTransport??fetch);
    const b=result.json;
    const requestId=id(b.requestId);if(!requestId)throw Error('CJ_REQUEST_ID_MISSING');
    // Retain bounded failure metadata and response hash, never provider message or raw body.
    const ok=b.code===200&&(b.result===true||b.success===true);
    const receipt={observedAt:new Date().toISOString(),request:spec,requestBody:body??null,requestId,rawBodySha256:result.rawSha256,providerCode:Number.isSafeInteger(b.code)?b.code:null,
      pointsInfo:null,summary:null};
    let schemaError;
    if(ok)try{receipt.summary=summarize(b.data);}catch(error){schemaError=error;receipt.schemaFailure="RESPONSE_SCHEMA_MISMATCH";}
    const serialized=JSON.stringify(receipt);
    if([config.directToken,config.credential].some(s=>serialized.includes(s)))throw Error('SECRET_ECHO_REFUSED');
    receipt.sanitizedSummarySha256=hash(JSON.stringify(receipt.summary));evidence.receipts.push(receipt);save(dir,`response-${n}.json`,receipt);
    if(!ok)throw Error('CJ_PROVIDER_REFUSED');if(schemaError)throw schemaError;return receipt.summary;
  }
  try{
    const product=await observe('/product/query?pid='+PID,'GET',null,productSummary);
    const inventory=await observe('/product/stock/getInventoryByPid?pid='+PID,'GET',null,inventorySummary);
    const selected=choose(product,inventory);evidence.selected=selected;
    if(!selected){evidence.status='OBSERVED_NOT_QUALIFIABLE';evidence.reason='NO_EXACT_VARIANT_WITH_RECONCILED_POSITIVE_CJ_SUBWAREHOUSE_STOCK';}
    else{
      const body={startCountryCode:selected.countryCode,endCountryCode:'US',storageIdList:[selected.stockId],shippingMode:2,products:[{quantity:1,vid:selected.vid}]};
      const freight=await observe('/logistic/freightCalculate','POST',body,freightSummary);
      evidence.status='OBSERVED_NOT_QUALIFIED';
      evidence.derived={currency:'USD',costAndFreightSubtotals:freight.options.filter(o=>o.logisticName&&o.logisticPriceCents!==null).map(o=>({logisticName:o.logisticName,cents:selected.costCents+o.logisticPriceCents,excludes:'Amazon fees, duties/taxes not explicitly included, other attributable costs; not realised profit'}))};
    }
    evidence.unknowns=['Independent account identity','Customer ZIP/address-specific delivery','Amazon matching offer and fees','Compliance and Pillow approval','Settled supplier invoice and realised economics','Actual point debit'];
  }catch(error){evidence.status='FAILED_CLOSED';evidence.failure=/^[A-Z][A-Z0-9_]{1,100}$/.test(error?.message??'')?error.message:'UNEXPECTED_RESPONSE';}
  evidence.finishedAt=new Date().toISOString();save(dir,'receipt.json',evidence);return evidence;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const r=await runSupplierReadback(process.env,resolve('provider-readback-evidence'));console.log(JSON.stringify({status:r.status,requestsAttempted:r.requestsAttempted,failure:r.failure??null}));if(r.status==='FAILED_CLOSED')process.exitCode=1;}
  catch{console.error('SUPPLIER_READBACK_REFUSED');process.exitCode=1;}
}
