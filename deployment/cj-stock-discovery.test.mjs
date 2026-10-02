import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {runDiscovery,SEARCH} from './cj-stock-discovery.mjs';
const env={ISOLATED_PROVIDER_READBACK:'1',CJ_DISCOVERY_POINT_LIMIT:'100',CJ_CREDENTIAL_MODE:'MCP_DIRECT',VERIFY_CJ_DIRECT_TOKEN:'MCP@CJ123@CJ:FAKE-TEST-TOKEN-123456789'};
const product=pid=>({pid,productNameEn:'Product '+pid,productType:'ORDINARY_PRODUCT',variants:[{pid,vid:'v-'+pid,variantSku:'sku-'+pid,variantSellPrice:3.25}]});
const stock=(pid,n)=>({variantInventories:[{vid:'v-'+pid,inventory:[{countryCode:'US',cjInventory:n,factoryInventory:999,stock:[{stockId:'us-warehouse',inventory:n,factoryInventory:999}]}]}]});
async function fixture(fn){const root=mkdtempSync(join(tmpdir(),'cj-discovery-'));try{await fn(join(root,'evidence'));}finally{rmSync(root,{recursive:true,force:true});}}
test('bounded discovery rejects factory stock, quotes one exact stocked variant, persists and refuses restart',()=>fixture(async dir=>{
 const payloads=[{content:[{productList:[{id:'p1'},{id:'p2'}]}]},product('p1'),stock('p1',0),product('p2'),stock('p2',12),[{logisticName:'USPS',logisticPrice:4.25}]];const calls=[];
 const t=async(url,init)=>{calls.push({url,method:init.method,body:init.body});return new Response(JSON.stringify({code:200,result:true,requestId:'id-'+calls.length,data:payloads[calls.length-1]}));};
 const r=await runDiscovery(env,dir,{testTransport:t});assert.equal(r.pointsReserved,100);assert.equal(calls.length,6);assert.ok(calls[0].url.endsWith(SEARCH));assert.equal(r.selected.pid,'p2');assert.equal(r.selected.cjUnits,12);assert.equal(r.qualificationAllowed,false);assert.equal(r.actualEconomics,null);assert.equal(JSON.parse(calls[5].body).products[0].vid,'v-p2');assert.equal(calls.filter(c=>c.method==='POST').length,1);assert.doesNotMatch(readFileSync(join(dir,'receipt.json'),'utf8'),/FAKE-TEST-TOKEN/);await assert.rejects(runDiscovery(env,dir,{testTransport:t}),/EEXIST/);assert.equal(calls.length,6);
}));
test('empty search consumes one bounded read and never expands discovery',()=>fixture(async dir=>{let n=0;const r=await runDiscovery(env,dir,{testTransport:async()=>{n++;return new Response(JSON.stringify({code:200,result:true,requestId:'id',data:{content:[]}}));}});assert.equal(n,1);assert.equal(r.status,'NO_ELIGIBLE_STOCK_WITHIN_BOUND');assert.equal(r.pointsReserved,50);}));
test('provider denial and production/rerun/expanded budget fail closed without retry',async()=>{
 await fixture(async dir=>{let n=0;const r=await runDiscovery(env,dir,{testTransport:async()=>{n++;return new Response('no',{status:401});}});assert.equal(n,1);assert.equal(r.status,'FAILED_CLOSED');});
 for(const patch of [{RAILWAY_DEPLOYMENT_ID:'protected'},{GITHUB_RUN_ATTEMPT:'2'},{CJ_DISCOVERY_POINT_LIMIT:'200'}])await fixture(async dir=>{await assert.rejects(runDiscovery({...env,...patch},dir));});
});

test('supplier-shipped and previously rejected products stop before paid stock or freight reads',()=>fixture(async dir=>{
 const payloads=[{content:[{productList:[{id:'1872203651945525250'},{id:'new-supplier'}]}]},{...product('new-supplier'),productType:'SUPPLIER_SHIPPED_PRODUCT'}];let n=0;
 const r=await runDiscovery(env,dir,{testTransport:async()=>new Response(JSON.stringify({code:200,result:true,requestId:'screen-'+n,data:payloads[n++]}))});
 assert.equal(n,2);assert.equal(r.pointsReserved,60);assert.equal(r.selected,null);assert.equal(r.status,'NO_ELIGIBLE_STOCK_WITHIN_BOUND');assert.equal(r.candidates[0].decision,'REJECT_PREVIOUSLY_SCREENED');assert.equal(r.candidates[1].decision,'REJECT_SUPPLIER_CONTROLS_FULFILMENT');
}));

import {screenFulfilment} from './cj-eligibility-screen.mjs';
test('unknown and partner supplier classifications never become CJ-controlled approval evidence',()=>{
 for(const productType of [null,undefined,'SUPPLIER_PRODUCT','SERVICE_PRODUCT','PACKAGING_PRODUCT','5',''])assert.equal(screenFulfilment({productType}).eligible,false);
 assert.equal(screenFulfilment({productType:'ORDINARY_PRODUCT'}).code,'STOCK_EVIDENCE_REQUIRED');
});
