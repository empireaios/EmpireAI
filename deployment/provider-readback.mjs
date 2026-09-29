/** Isolated provider observation only. Does not import/start EmpireAI or write its stores. */
import {createHash} from 'node:crypto';
import {mkdirSync,openSync,writeFileSync,fsyncSync,closeSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const US='ATVPDKIKX0DER';
const CJ='https://developers.cjdropshipping.com/api2.0/v1';
const hash=value=>createHash('sha256').update(value).digest('hex');
const requireValue=(value,name)=>{if(typeof value!=='string'||!value.trim())throw new Error('MISSING_'+name);return value;};
function save(dir,name,value) {
  const text=JSON.stringify(value,null,2)+'\n',path=resolve(dir,name);
  const fd=openSync(path,'wx',0o600);
  try{writeFileSync(fd,text);fsyncSync(fd);}finally{closeSync(fd);}
  if(readFileSync(path,'utf8')!==text)throw new Error('EVIDENCE_READBACK_FAILED');
  const directory=openSync(dir,'r');try{fsyncSync(directory);}finally{closeSync(directory);}
}
export function configuration(env) {
  if(env.ISOLATED_PROVIDER_READBACK!=='1'||env.RAILWAY_DEPLOYMENT_ID||env.VERCEL||env.NODE_ENV==='production')throw new Error('ISOLATION_REQUIRED');
  const provider=env.READBACK_PROVIDER;
  if(!['amazon','cj'].includes(provider))throw new Error('PROVIDER_NOT_ALLOWED');
  if(env.GITHUB_RUN_ATTEMPT && env.GITHUB_RUN_ATTEMPT!=='1')throw new Error('AUTOMATIC_RERUN_REFUSED');
  if(provider==='amazon') {
    const seller=requireValue(env.VERIFY_AMAZON_SELLER_ID,'VERIFY_AMAZON_SELLER_ID');
    if(!/^[A-Z0-9]{5,32}$/.test(seller))throw new Error('SELLER_ID_INVALID');
    return {provider,seller,clientId:requireValue(env.VERIFY_AMAZON_CLIENT_ID,'VERIFY_AMAZON_CLIENT_ID'),
      clientSecret:requireValue(env.VERIFY_AMAZON_CLIENT_SECRET,'VERIFY_AMAZON_CLIENT_SECRET'),
      refreshToken:requireValue(env.VERIFY_AMAZON_REFRESH_TOKEN,'VERIFY_AMAZON_REFRESH_TOKEN')};
  }
  if(env.CJ_READBACK_POINT_LIMIT!=='50')throw new Error('CJ_FIXED_50_POINT_BOUND_REQUIRED');
  if(env.CJ_CREDENTIAL_MODE==='MCP_DIRECT') {
    if(env.VERIFY_CJ_API_KEY)throw new Error('AMBIGUOUS_CJ_CREDENTIALS');
    const credential=requireValue(env.VERIFY_CJ_DIRECT_TOKEN,'VERIFY_CJ_DIRECT_TOKEN');
    // CJ official source e8375d8 url-parser/session/http-client: direct token, NOT apiKey exchange.
    // Strict subset only; never accept a URL, percent encoding, whitespace or header controls.
    const match=credential.match(/^MCP@(CJ[0-9]{1,24})@CJ:([A-Za-z0-9._~-]{16,2048})$/);
    if(!match)throw new Error('CJ_DIRECT_TOKEN_FORMAT_UNSUPPORTED');
    return {provider,directToken:match[2],claimedAccount:match[1],credential};
  }
  if(env.CJ_CREDENTIAL_MODE && env.CJ_CREDENTIAL_MODE!=='API_KEY')throw new Error('CJ_CREDENTIAL_MODE_UNSUPPORTED');
  return {provider,apiKey:requireValue(env.VERIFY_CJ_API_KEY,'VERIFY_CJ_API_KEY')};
}
export function plan(config) {
  if(config.directToken)return [{method:'GET',url:CJ+'/product/list?pageNum=1&pageSize=1',authentication:false}];
  return config.provider==='amazon' ? [
    {method:'POST',url:'https://api.amazon.com/auth/o2/token',authentication:true},
    {method:'GET',url:`https://sellingpartnerapi-na.amazon.com/listings/2021-08-01/items/${config.seller}?marketplaceIds=${US}&includedData=summaries%2Coffers%2CfulfillmentAvailability&pageSize=1`,authentication:false},
  ] : [
    {method:'POST',url:CJ+'/authentication/getAccessToken',authentication:true},
    {method:'GET',url:CJ+'/product/list?pageNum=1&pageSize=1',authentication:false},
  ];
}
export function summarizeAmazon(body) {
  if(!Array.isArray(body?.items)||body.items.length>1)throw new Error('AMAZON_SCHEMA_MISMATCH');
  return {marketplaceId:US,completeInventory:false,morePages:Boolean(body.pagination?.nextToken),items:body.items.map(item=>{
    const matches=item.summaries?.filter(s=>s.marketplaceId===US);
    if(typeof item.sku!=='string'||item.sku.length>256||matches?.length!==1||!/^[A-Z0-9]{10}$/.test(matches[0].asin))throw new Error('AMAZON_IDENTITY_MISMATCH');
    const offers=(item.offers??[]).filter(o=>o.marketplaceId===US&&o.offerType==='B2C');
    const availability=(item.fulfillmentAvailability??[]).filter(a=>a.fulfillmentChannelCode==='DEFAULT');
    if(offers.length>1||availability.length>1)throw new Error('AMAZON_AMBIGUOUS_READBACK');
    const price=offers[0]?.price, amount=price?.amount;
    const compatible=price?.currency==='USD'&&typeof amount==='string'&&/^(?:0|[1-9]\d{0,10})(?:\.\d{1,2})?$/.test(amount)&&Number(amount)>0;
    return {sku:item.sku,asin:matches[0].asin,buyable:Array.isArray(matches[0].status)&&matches[0].status.includes('BUYABLE'),
      priceWireType:typeof amount,priceUsd:compatible?amount:null,priceParserCompatible:compatible,
      sellerQuantity:Number.isSafeInteger(availability[0]?.quantity)&&availability[0].quantity>=0?availability[0].quantity:null};
  }),supplierStockVerified:false,feesVerified:false,qualificationAllowed:false};
}
export function summarizeCj(body) {
  if(body?.code!==200||body.result!==true||!Array.isArray(body.data?.list)||body.data.list.length>1)throw new Error('CJ_SCHEMA_MISMATCH');
  return {products:body.data.list.map(row=>{
    if(typeof row.pid!=='string'||!row.pid||row.pid.length>200)throw new Error('CJ_IDENTITY_MISMATCH');
    return {pid:row.pid,productSku:typeof row.productSku==='string'?row.productSku.slice(0,200):null,
      summaryPriceType:typeof row.sellPrice,summaryHasVariants:Array.isArray(row.variants),
      summaryPriceIsNotVariantCost:true};
  }),variantCostVerified:false,cjManagedStockVerified:false,freightVerified:false,qualificationAllowed:false};
}
async function request(spec,headers,body,fetchImpl) {
  let response;
  try{response=await fetchImpl(spec.url,{method:spec.method,headers,body,redirect:'error',signal:AbortSignal.timeout(15_000)});}
  catch{throw new Error('NETWORK_OR_REDIRECT_FAILURE');}
  if(!response.ok) {await response.body?.cancel();throw new Error('PROVIDER_HTTP_'+response.status);}
  const reader=response.body?.getReader();if(!reader)throw new Error('EMPTY_RESPONSE');
  let size=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024*1024){await reader.cancel();throw new Error('RESPONSE_TOO_LARGE');}chunks.push(value);}}
  catch(error){if(error?.message==='RESPONSE_TOO_LARGE')throw error;throw new Error('BODY_READ_FAILED');}
  const raw=Buffer.concat(chunks).toString('utf8');let json;try{json=JSON.parse(raw);}catch{throw new Error('INVALID_JSON');}
  return {json,rawSha256:hash(raw),requestId:response.headers.get('x-amzn-requestid')};
}
export async function runReadback(env,dir,{testTransport}={}) {
  const config=configuration(env),requests=plan(config);
  // Exclusive directory is a durable one-attempt latch, including uncertain network outcomes.
  mkdirSync(dir,{mode:0o700});
  const evidence={schemaVersion:1,provider:config.provider,evidenceMode:testTransport?'OFFLINE_TEST':'PROVIDER_READBACK_ATTEMPT',
    sourceHead:env.GITHUB_SHA??null,startedAt:new Date().toISOString(),status:'STARTED',
    plannedRequests:requests,maximumBusinessReads:1,cjPointsReserved:config.provider==='cj'?50:0,
    authority:{birth:'NOT_BORN',commerce:'LOCKED'},liveCommerceAllowed:false,receipts:[]};
  save(dir,'admission.json',evidence);
  try {
    const amazon=config.provider==='amazon';
    let token=config.directToken;
    if(config.directToken) {
      evidence.account={claimedCjAccount:config.claimedAccount,accountSource:'UNVERIFIED_CREDENTIAL_LABEL',ownerIdentityConfirmed:false};
      evidence.credentialMode='MCP_DIRECT_SOURCE_BACKED_UNVERIFIED_DEPLOYMENT';
    } else {
    const authBody=amazon?new URLSearchParams({grant_type:'refresh_token',client_id:config.clientId,client_secret:config.clientSecret,refresh_token:config.refreshToken}).toString():JSON.stringify({apiKey:config.apiKey});
    const auth=await request(requests[0],{'content-type':amazon?'application/x-www-form-urlencoded':'application/json'},authBody,testTransport??fetch);
    token=amazon?auth.json.access_token:auth.json.data?.accessToken;
    if(typeof token!=='string'||!token||amazon&&(!Number.isFinite(auth.json.expires_in)||auth.json.expires_in<60)||
      !amazon&&(auth.json.code!==200||auth.json.result!==true||!(Date.parse(auth.json.data?.accessTokenExpiryDate)>Date.now()+60_000)))throw new Error('AUTHENTICATION_RESPONSE_INVALID');
    evidence.account={requestedSellerId:amazon?config.seller:null,cjOpenId:!amazon&&/^[0-9]{1,24}$/.test(String(auth.json.data?.openId))?String(auth.json.data.openId):null,
      ownerIdentityConfirmed:false};
    // Authentication material is neither saved nor hashed into evidence.
    if(!amazon&&!evidence.account.cjOpenId)throw new Error('CJ_ACCOUNT_ID_MISSING');
    if(!amazon)await new Promise(resolve=>setTimeout(resolve,1100));
    }
    const result=await request(requests[config.directToken?0:1],amazon?{'x-amz-access-token':token}:{'CJ-Access-Token':token},undefined,testTransport??fetch);
    const requestId=amazon?result.requestId:result.json.requestId;
    if(typeof requestId!=='string'||!requestId||requestId.length>256)throw new Error('PROVIDER_REQUEST_ID_MISSING');
    const summary=amazon?summarizeAmazon(result.json):summarizeCj(result.json);
    if([token,config.credential,config.clientSecret,config.refreshToken,config.apiKey].filter(Boolean).some(secret=>JSON.stringify({summary,requestId}).includes(secret)))throw new Error('SECRET_ECHO_REFUSED');
    evidence.receipts.push({observedAt:new Date().toISOString(),requestId,rawBodySha256:result.rawSha256,
      sanitizedSummarySha256:hash(JSON.stringify(summary)),summary});
    evidence.status='OBSERVED_NOT_QUALIFIED';
    if(!testTransport)evidence.evidenceMode='AUTHENTICATED_HTTP_OBSERVATION';
    evidence.reconciliation={projectedEconomicsUnchanged:true,actualEconomics:null,transactionLink:'UNMATCHED',
      next:amazon?'Compare observed SKU/ASIN, price wire type and DEFAULT quantity with existing importer assumptions. Empty page is not a sale or full-inventory proof.':'Use an observed PID to select an exact VID before any separate bounded cost/stock/freight verification. Catalog prices are not procurement costs.'};
  } catch(error) {
    evidence.status='FAILED_CLOSED';
    // Only our own fixed error codes escape; never provider text, request headers or token responses.
    evidence.failure=/^[A-Z][A-Z0-9_]{1,100}$/.test(error?.message??'')?error.message:'UNEXPECTED_RESPONSE';
  }
  evidence.finishedAt=new Date().toISOString();save(dir,'receipt.json',evidence);return evidence;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try{const receipt=await runReadback(process.env,resolve('provider-readback-evidence'));
    console.log(JSON.stringify({provider:receipt.provider,status:receipt.status,failure:receipt.failure??null}));
    if(receipt.status!=='OBSERVED_NOT_QUALIFIED')process.exitCode=1;
  }catch(error){console.error(/^[A-Z][A-Z0-9_]{1,100}$/.test(error?.message??'')?error.message:'READBACK_REFUSED');process.exitCode=1;}
}
