/** Bounded, read-only US-stock discovery. No application startup or commercial writes. */
import {mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {configuration,save,request} from './provider-readback.mjs';
import {productSummary,inventorySummary,choose,freightSummary} from './cj-supplier-readback.mjs';
const BASE='https://developers.cjdropshipping.com/api2.0/v1';
export const SEARCH='/product/listV2?page=1&size=2&countryCode=US&startWarehouseInventory=1&verifiedWarehouse=1&orderBy=4&sort=desc';
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function searchSummary(data){
 if(!Array.isArray(data?.content)||data.content.length>2)throw Error('DISCOVERY_SCHEMA');
 const products=data.content.flatMap(c=>c.productList??[]);
 if(products.length>2||products.some(p=>typeof p.id!=='string'||! /^[A-Za-z0-9-]{1,80}$/.test(p.id)))throw Error('DISCOVERY_IDENTITY');
 if(new Set(products.map(p=>p.id)).size!==products.length)throw Error('DISCOVERY_DUPLICATE_PID');
 return {products:products.map(p=>({pid:p.id,name:typeof p.nameEn==='string'?p.nameEn.slice(0,300):null,sku:typeof p.sku==='string'?p.sku.slice(0,200):null,summaryStockIsNotProof:true})),page:1,maximumProducts:2};
}
export async function runDiscovery(env,dir,{testTransport}={}){
 if(env.CJ_DISCOVERY_POINT_LIMIT!=='100'||env.CJ_CREDENTIAL_MODE!=='MCP_DIRECT')throw Error('FIXED_DISCOVERY_BOUND_REQUIRED');
 const config=configuration({...env,READBACK_PROVIDER:'cj',CJ_READBACK_POINT_LIMIT:'50'});
 mkdirSync(dir,{mode:0o700});
 const e={schemaVersion:1,sourceHead:env.GITHUB_SHA??null,evidenceMode:testTransport?'OFFLINE_TEST':'AUTHENTICATED_HTTP_OBSERVATION',startedAt:new Date().toISOString(),status:'STARTED',maximumRequests:6,maximumPoints:100,pointsReserved:0,requestsAttempted:0,retries:0,businessWrites:0,authority:{birth:'NOT_BORN',commerce:'LOCKED'},receipts:[],candidates:[],selected:null,freight:null,qualificationAllowed:false,actualEconomics:null};
 save(dir,'admission.json',e);
 async function observe(path,points,summarize,body){
  if(e.requestsAttempted>=6||e.pointsReserved+points>100)throw Error('DISCOVERY_BOUND_EXCEEDED');
  const n=++e.requestsAttempted;e.pointsReserved+=points;
  const spec={url:BASE+path,method:body?'POST':'GET'};
  save(dir,`request-${n}.json`,{...spec,body:body??null,pointsReserved:points});
  if(n>1&&!testTransport)await new Promise(r=>setTimeout(r,1100));
  const result=await request(spec,{'CJ-Access-Token':config.directToken,'content-type':'application/json'},body?JSON.stringify(body):undefined,testTransport??fetch);
  const b=result.json;if(typeof b.requestId!=='string'||!/^[A-Za-z0-9-]{1,100}$/.test(b.requestId))throw Error('REQUEST_ID_MISSING');
  const receipt={observedAt:new Date().toISOString(),request:spec,requestBody:body??null,requestId:b.requestId,rawBodySha256:result.rawSha256,providerCode:Number.isSafeInteger(b.code)?b.code:null,summary:null};
  let failure;const ok=b.code===200&&(b.result===true||b.success===true);
  if(ok)try{receipt.summary=summarize(b.data);}catch{failure='PROVIDER_SCHEMA_MISMATCH';}
  if([config.directToken,config.credential].some(s=>JSON.stringify(receipt).includes(s)))throw Error('SECRET_ECHO_REFUSED');
  receipt.sanitizedSummarySha256=digest(receipt.summary);e.receipts.push(receipt);save(dir,`response-${n}.json`,receipt);
  if(!ok||failure)throw Error(failure??'PROVIDER_REFUSED');return receipt.summary;
 }
 try{
  const discovered=await observe(SEARCH,50,searchSummary);
  for(const p of discovered.products){
   const product=await observe('/product/query?pid='+p.pid,10,d=>productSummary(d,p.pid));
   const stock=await observe('/product/stock/getInventoryByPid?pid='+p.pid,10,inventorySummary);
   const usStock={variantInventories:stock.variantInventories.map(v=>({...v,inventory:v.inventory.filter(w=>w.countryCode==='US')}))};
   const eligible=choose(product,usStock);
   e.candidates.push({pid:p.pid,name:product.name,product,stock,eligible,decision:eligible?'SUPPLIER_EVIDENCE_ONLY':'REJECT_NO_RECONCILED_US_CJ_STOCK'});
  }
  const eligible=e.candidates.filter(c=>c.eligible).sort((a,b)=>b.eligible.cjUnits-a.eligible.cjUnits||a.eligible.costCents-b.eligible.costCents||a.pid.localeCompare(b.pid));
  if(eligible.length){const c=eligible[0];e.selected={pid:c.pid,name:c.name,...c.eligible};
   e.freight=await observe('/logistic/freightCalculate',10,freightSummary,{startCountryCode:'US',endCountryCode:'US',storageIdList:[c.eligible.stockId],shippingMode:2,products:[{quantity:1,vid:c.eligible.vid}]});
   e.status='SUPPLIER_OBSERVED_MARKETPLACE_QUALIFICATION_PENDING';
  }else e.status='NO_ELIGIBLE_STOCK_WITHIN_BOUND';
 }catch(error){e.status='FAILED_CLOSED';e.failure=/^[A-Z][A-Z0-9_]{1,100}$/.test(error?.message??'')?error.message:'UNEXPECTED_RESPONSE';}
 e.limits={destination:'US_COUNTRY_ONLY_ZIP_UNKNOWN',accountIdentity:'UNVERIFIED',actualPointDebit:null,amazonIdentity:null,amazonFees:null,sellingPrice:null,landedCost:null,profit:null,kingApproval:'LOCKED',selection:'Highest observed eligible US CJ units, then lowest variant cost; not a profitability rank'};
 e.finishedAt=new Date().toISOString();save(dir,'receipt.json',e);return e;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const e=await runDiscovery(process.env,resolve('provider-readback-evidence'));console.log(JSON.stringify({status:e.status,requests:e.requestsAttempted,pointsReserved:e.pointsReserved}));if(e.status==='FAILED_CLOSED')process.exitCode=1;}catch{console.error('DISCOVERY_REFUSED');process.exitCode=1;}
}
