import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {configuration,plan,runReadback,summarizeAmazon} from './provider-readback.mjs';
const amazon={ISOLATED_PROVIDER_READBACK:'1',READBACK_PROVIDER:'amazon',VERIFY_AMAZON_SELLER_ID:'ASELLER1',
  VERIFY_AMAZON_CLIENT_ID:'client-id',VERIFY_AMAZON_CLIENT_SECRET:'SECRET-CLIENT',VERIFY_AMAZON_REFRESH_TOKEN:'SECRET-REFRESH'};
const cj={ISOLATED_PROVIDER_READBACK:'1',READBACK_PROVIDER:'cj',CJ_READBACK_POINT_LIMIT:'50',VERIFY_CJ_API_KEY:'SECRET-CJ-KEY'};
const json=value=>new Response(JSON.stringify(value),{headers:{'x-amzn-requestid':'provider-request-1'}});
const listing={items:[{sku:'SKU1',summaries:[{marketplaceId:'ATVPDKIKX0DER',asin:'B0TEST1234',status:['BUYABLE']}],
  offers:[{marketplaceId:'ATVPDKIKX0DER',offerType:'B2C',price:{currency:'USD',amount:'12.30'}}],
  fulfillmentAvailability:[{fulfillmentChannelCode:'DEFAULT',quantity:2}]}]};
async function fixture(fn){const dir=mkdtempSync(join(tmpdir(),'provider-readback-test-'));try{await fn(join(dir,'evidence'));}finally{rmSync(dir,{recursive:true,force:true});}}
test('missing credentials production and automatic reruns refuse before outbound requests',()=>{
  for(const patch of [{VERIFY_AMAZON_REFRESH_TOKEN:''},{ISOLATED_PROVIDER_READBACK:'0'},{RAILWAY_DEPLOYMENT_ID:'protected'},{VERCEL:'1'},{GITHUB_RUN_ATTEMPT:'2'}])assert.throws(()=>configuration({...amazon,...patch}));
  assert.throws(()=>configuration({...cj,CJ_READBACK_POINT_LIMIT:'500'}));
  const requests=plan(configuration(amazon));assert.equal(requests.length,2);
  assert.equal(requests[1].method,'GET');assert.match(requests[1].url,/^https:\/\/sellingpartnerapi-na.amazon.com\/listings\//);
});
test('Amazon isolated readback reconciles identities and persists evidence without credentials; restart cannot repeat',()=>fixture(async dir=>{
  const calls=[];
  const testTransport=async(url,init)=>{calls.push({url,method:init.method});assert.equal(init.redirect,'error');
    return calls.length===1?json({access_token:'SECRET-ACCESS',expires_in:3600}):json(listing);};
  const receipt=await runReadback(amazon,dir,{testTransport});assert.equal(receipt.status,'OBSERVED_NOT_QUALIFIED');
  assert.deepEqual(calls.map(x=>x.method),['POST','GET']);assert.equal(receipt.receipts[0].summary.items[0].sellerQuantity,2);
  assert.equal(receipt.reconciliation.actualEconomics,null);assert.equal(receipt.evidenceMode,'OFFLINE_TEST');
  const saved=readFileSync(join(dir,'receipt.json'),'utf8');assert.doesNotMatch(saved,/SECRET-/);
  assert.deepEqual(JSON.parse(saved),receipt);
  await assert.rejects(runReadback(amazon,dir,{testTransport}),/EEXIST/);assert.equal(calls.length,2);
}));
test('wire-type drift and empty account do not fabricate prices stock fees or sales',()=>{
  const altered=structuredClone(listing);altered.items[0].offers[0].price.amount=12.3;
  const observed=summarizeAmazon(altered);assert.equal(observed.items[0].priceParserCompatible,false);assert.equal(observed.items[0].priceUsd,null);
  assert.equal(summarizeAmazon({items:[]}).items.length,0);
  assert.throws(()=>summarizeAmazon({items:[{sku:'SKU',summaries:[]}]}),/IDENTITY/);
});
test('provider denial, redirects and malformed bodies retain a failed receipt and never retry',async()=>{
  for(const status of [302,401,403,429,500])await fixture(async dir=>{
    let calls=0;const receipt=await runReadback(amazon,dir,{testTransport:async()=>{calls++;return new Response('SECRET-REFRESH',{status});}});
    assert.equal(calls,1);assert.equal(receipt.status,'FAILED_CLOSED');assert.equal(receipt.failure,'PROVIDER_HTTP_'+status);
    assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/SECRET-/);
  });
});
test('CJ catalog reserves only 50 points and never promotes summary price or stock to qualification',()=>fixture(async dir=>{
  let calls=0;const receipt=await runReadback(cj,dir,{testTransport:async(url,init)=>{calls++;
    return calls===1?json({code:200,result:true,data:{openId:123,accessToken:'SECRET-CJ-ACCESS',accessTokenExpiryDate:'2099-01-01T00:00:00Z'}}):
      json({code:200,result:true,requestId:'cj-request',data:{list:[{pid:'PID1',productSku:'CJ-SKU',sellPrice:'2-4'}]}});}});
  assert.equal(calls,2);assert.equal(receipt.cjPointsReserved,50);assert.equal(receipt.account.cjOpenId,'123');
  assert.equal(receipt.receipts[0].summary.variantCostVerified,false);assert.equal(receipt.liveCommerceAllowed,false);
  assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/SECRET-/);
}));
test('secret echo and excessive response size fail closed without persisting response text',async()=>{
  for(const huge of [false,true])await fixture(async dir=>{let calls=0;
    const receipt=await runReadback(amazon,dir,{testTransport:async()=>{if(++calls===1)return json({access_token:'SECRET-ACCESS',expires_in:3600});
      if(huge)return new Response('X'.repeat(1024*1024+1));
      const row=structuredClone(listing);row.items[0].sku='SECRET-ACCESS';return json(row);}});
    assert.equal(receipt.status,'FAILED_CLOSED');assert.equal(receipt.failure,huge?'RESPONSE_TOO_LARGE':'SECRET_ECHO_REFUSED');
    assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/SECRET-/);
  });
});
const direct={ISOLATED_PROVIDER_READBACK:'1',READBACK_PROVIDER:'cj',CJ_READBACK_POINT_LIMIT:'50',CJ_CREDENTIAL_MODE:'MCP_DIRECT',VERIFY_CJ_DIRECT_TOKEN:'MCP@CJ12345@CJ:fixture_access_token_123'};
test('CJ direct token uses exactly one catalog GET, no exchange, and preserves unverified identity',()=>fixture(async dir=>{
  let count=0;
  const receipt=await runReadback(direct,dir,{testTransport:async(url,options)=>{
    count++;assert.equal(options.method,'GET');assert.equal(options.body,undefined);
    assert.equal(url,'https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=1&pageSize=1');
    assert.equal(options.headers['CJ-Access-Token'],'fixture_access_token_123');
    assert.equal(options.redirect,'error');
    return json({code:200,result:true,requestId:'direct-request',data:{list:[{pid:'real-shape-fixture'}]}});
  }});
  assert.equal(count,1);assert.equal(receipt.status,'OBSERVED_NOT_QUALIFIED');
  assert.equal(receipt.account.ownerIdentityConfirmed,false);assert.equal(receipt.account.accountSource,'UNVERIFIED_CREDENTIAL_LABEL');
  assert.equal(receipt.cjPointsReserved,50);assert.equal(receipt.liveCommerceAllowed,false);
  assert.equal(receipt.reconciliation.actualEconomics,null);
  for(const name of ['admission.json','receipt.json'])assert.equal(readFileSync(join(dir,name),'utf8').includes('fixture_access_token_123'),false);
}));
test('CJ direct token rejects ambiguous unsupported and injected credentials before transport',()=>{
  for(const patch of [{VERIFY_CJ_API_KEY:'existing-production-key'},{VERIFY_CJ_DIRECT_TOKEN:'API@CJ12345@CJ:fixture_access_token_123'},
    {VERIFY_CJ_DIRECT_TOKEN:'https://developers.cjdropshipping.com/mcp/'+direct.VERIFY_CJ_DIRECT_TOKEN},
    {VERIFY_CJ_DIRECT_TOKEN:direct.VERIFY_CJ_DIRECT_TOKEN+'\r\nheader:value'},{CJ_CREDENTIAL_MODE:'OTHER'}])assert.throws(()=>configuration({...direct,...patch}));
});
test('CJ direct auth rejection stops after one GET with no refresh fallback',()=>fixture(async dir=>{
 let calls=0;const receipt=await runReadback(direct,dir,{testTransport:async()=>{calls++;return new Response('secret provider error',{status:401});}});
 assert.equal(calls,1);assert.equal(receipt.status,'FAILED_CLOSED');assert.equal(receipt.failure,'PROVIDER_HTTP_401');
 assert.equal(receipt.receipts.length,0);
}));
